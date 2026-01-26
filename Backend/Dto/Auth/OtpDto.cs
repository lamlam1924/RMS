using System.ComponentModel.DataAnnotations;

namespace RMS.Dto.Auth;

public class SendOtpRequestDto
{
    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = null!;
}

public class VerifyOtpRequestDto
{
    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = null!;
    
    [Required(ErrorMessage = "OTP là bắt buộc")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "OTP phải có 6 ký tự")]
    public string OtpCode { get; set; } = null!;
}

public class OtpResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public DateTime? ExpiresAt { get; set; }
}
