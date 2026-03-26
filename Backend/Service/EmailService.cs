using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;
using RMS.Service.Interface;

namespace RMS.Service;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly IWebHostEnvironment _environment;

    public EmailService(
        IConfiguration configuration, 
        ILogger<EmailService> logger,
        IWebHostEnvironment environment)
    {
        _configuration = configuration;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Gửi email OTP (backward compatibility)
    /// </summary>
    public async Task SendOtpEmailAsync(string toEmail, string otpCode)
    {
        var data = new { OtpCode = otpCode };
        await SendTemplatedEmailAsync(toEmail, "Mã xác thực OTP - RMS", "OtpEmail", data);
    }

    /// <summary>
    /// Gửi email với template và data động
    /// </summary>
    public async Task SendTemplatedEmailAsync(string toEmail, string subject, string templateName, object data)
    {
        try
        {
            var htmlBody = await LoadAndRenderTemplateAsync(templateName, data);
            await SendEmailAsync(toEmail, subject, htmlBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send templated email {Template} to {Email}", templateName, toEmail);
            throw;
        }
    }

    /// <summary>
    /// Gửi email đơn giản với HTML content
    /// </summary>
    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUser = _configuration["Email:SmtpUser"] ?? "";
            var smtpPassword = _configuration["Email:SmtpPassword"] ?? "";
            var fromEmail = _configuration["Email:FromEmail"] ?? smtpUser;
            var fromName = _configuration["Email:FromName"] ?? "RMS Platform";

            using var message = new MailMessage();
            message.From = new MailAddress(fromEmail, fromName);
            message.To.Add(new MailAddress(toEmail));
            message.Subject = subject;
            message.IsBodyHtml = true;
            message.Body = htmlBody;

            using var smtpClient = new SmtpClient(smtpHost, smtpPort);
            smtpClient.EnableSsl = true;
            smtpClient.Credentials = new NetworkCredential(smtpUser, smtpPassword);
            smtpClient.Timeout = 15000; // 15 giây - tránh treo lâu khi SMTP lỗi

            await smtpClient.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {Email} with subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw new InvalidOperationException("Không thể gửi email. Vui lòng thử lại sau.");
        }
    }

    /// <summary>
    /// Load template từ file và render với data
    /// </summary>
    private async Task<string> LoadAndRenderTemplateAsync(string templateName, object data)
    {
        // Load template file
        var templatePath = Path.Combine(_environment.ContentRootPath, "EmailTemplates", $"{templateName}.html");
        
        if (!File.Exists(templatePath))
        {
            _logger.LogWarning("Template {Template} not found, using fallback", templateName);
            return GetFallbackTemplate(templateName, data);
        }

        var template = await File.ReadAllTextAsync(templatePath);
        
        // Replace tokens với data
        return RenderTemplate(template, data);
    }

    /// <summary>
    /// Render template bằng cách replace {{PropertyName}} với giá trị từ data object
    /// </summary>
    private string RenderTemplate(string template, object data)
    {
        if (data == null) return template;

        var result = template;
        var properties = data.GetType().GetProperties();

        foreach (var prop in properties)
        {
            var value = prop.GetValue(data)?.ToString() ?? "";
            var token = $"{{{{{prop.Name}}}}}"; // {{PropertyName}}
            result = result.Replace(token, value);
        }

        return result;
    }

    /// <summary>
    /// Fallback template khi không tìm thấy file template
    /// </summary>
    private string GetFallbackTemplate(string templateName, object data)
    {
        // Fallback cho OTP email
        if (templateName == "OtpEmail")
        {
            var otpCode = data.GetType().GetProperty("OtpCode")?.GetValue(data)?.ToString() ?? "";
            return $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <h2 style='color: #667eea;'>Recruitment Management System</h2>
                        <p>Xin chào,</p>
                        <p>Mã OTP của bạn để xác thực email là:</p>
                        <div style='background: #f7fafc; padding: 20px; text-align: center; margin: 20px 0;'>
                            <h1 style='color: #667eea; letter-spacing: 8px; margin: 0;'>{otpCode}</h1>
                        </div>
                        <p>Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
                        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                        <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                        <p style='color: #718096; font-size: 12px;'>
                            Email này được gửi tự động, vui lòng không trả lời.
                        </p>
                    </div>
                </body>
                </html>
            ";
        }

        // Generic fallback
        return $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #667eea;'>Recruitment Management System</h2>
                    <p>Nội dung email sẽ được hiển thị tại đây.</p>
                    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                    <p style='color: #718096; font-size: 12px;'>
                        Email này được gửi tự động, vui lòng không trả lời.
                    </p>
                </div>
            </body>
            </html>
        ";
    }
}
