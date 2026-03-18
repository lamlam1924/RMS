using System.Net.Http.Headers;
using System.Text.Json;
using RMS.Common;
using RMS.Dto.Auth;
using RMS.Entity;
using RMS.Repository;

namespace RMS.Service;

/// <summary>
/// Service xử lý authentication và authorization
/// </summary>
public interface IAuthService
{
    // ==================== Email Verification ====================
    
    /// <summary>Kiểm tra email đã tồn tại trong hệ thống</summary>
    Task<bool> EmailExistsAsync(string email);
    
    // ==================== Registration Flow ====================
    
    /// <summary>Gửi mã OTP để xác thực email khi đăng ký</summary>
    Task<OtpResponseDto> SendOtpAsync(string email);
    
    /// <summary>Xác thực mã OTP cho đăng ký</summary>
    Task<OtpResponseDto> VerifyOtpAsync(string email, string otpCode);
    
    /// <summary>Đăng ký tài khoản mới (yêu cầu email đã xác thực OTP)</summary>
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    
    // ==================== Forgot Password Flow ====================
    
    /// <summary>Gửi mã OTP để xác thực email khi quên mật khẩu</summary>
    Task<OtpResponseDto> SendForgotPasswordOtpAsync(string email);
    
    /// <summary>Xác thực mã OTP cho quên mật khẩu</summary>
    Task<OtpResponseDto> VerifyForgotPasswordOtpAsync(string email, string otpCode);
    
    /// <summary>Đặt lại mật khẩu mới (yêu cầu OTP đã xác thực)</summary>
    Task<bool> ResetPasswordAsync(string email, string newPassword);
    
    // ==================== Authentication ====================
    
    /// <summary>Đăng nhập bằng email và password</summary>
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    
    /// <summary>Đăng nhập bằng Google OAuth (xử lý authorization code)</summary>
    Task<LoginResponseDto> LoginWithGoogleAsync(string code);
    
    // ==================== Profile Management ====================

    /// <summary>Đổi mật khẩu khi đã đăng nhập (yêu cầu xác nhận mật khẩu cũ)</summary>
    Task ChangePasswordAsync(string userId, bool isCandidate, string currentPassword, string newPassword);

    /// <summary>Upload avatar cho User hoặc Candidate</summary>
    Task<string> UploadAvatarAsync(string userId, bool isCandidate, Stream fileStream, string fileName);

    // ==================== Token Management ====================
    
    /// <summary>Làm mới access token bằng refresh token</summary>
    Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
    
    /// <summary>Đăng xuất và thu hồi refresh token</summary>
    Task LogoutAsync(string refreshToken);
}