using System.Net;
using System.Net.Mail;

namespace RMS.Service;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendOtpEmailAsync(string toEmail, string otpCode)
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
            message.Subject = "Mã xác thực OTP - RMS";
            message.IsBodyHtml = true;
            message.Body = $@"
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

            using var smtpClient = new SmtpClient(smtpHost, smtpPort);
            smtpClient.EnableSsl = true;
            smtpClient.Credentials = new NetworkCredential(smtpUser, smtpPassword);

            await smtpClient.SendMailAsync(message);
            _logger.LogInformation("OTP email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email to {Email}", toEmail);
            throw new InvalidOperationException("Không thể gửi email. Vui lòng thử lại sau.");
        }
    }
}
