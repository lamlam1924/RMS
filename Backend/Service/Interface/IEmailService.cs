namespace RMS.Service.Interface;

/// <summary>
/// Service gửi email thông qua SMTP
/// </summary>
public interface IEmailService
{
    /// <summary>Gửi email chứa mã OTP xác thực</summary>
    Task SendOtpEmailAsync(string toEmail, string otpCode);
    
    /// <summary>Gửi email với template và data động</summary>
    Task SendTemplatedEmailAsync(string toEmail, string subject, string templateName, object data);
    
    /// <summary>Gửi email đơn giản với HTML content</summary>
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
}
