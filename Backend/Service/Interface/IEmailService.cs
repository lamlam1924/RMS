namespace RMS.Service;

/// <summary>
/// Service gửi email thông qua SMTP
/// </summary>
public interface IEmailService
{
    /// <summary>Gửi email chứa mã OTP xác thực</summary>
    Task SendOtpEmailAsync(string toEmail, string otpCode);
}
