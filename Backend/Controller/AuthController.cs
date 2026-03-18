using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using RMS.Data;
using RMS.Dto.Auth;
using RMS.Service;

namespace RMS.Controller;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly RecruitmentDbContext _context;

    public AuthController(IAuthService authService, ILogger<AuthController> logger, RecruitmentDbContext context)
    {
        _authService = authService;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Check if email already exists
    /// </summary>
    [HttpGet("check-email")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckEmail([FromQuery] string email)
    {
        try
        {
            var exists = await _authService.EmailExistsAsync(email);
            return Ok(new { exists });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking email");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Send OTP to email for verification
    /// </summary>
    [HttpPost("send-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequestDto request)
    {
        try
        {
            var response = await _authService.SendOtpAsync(request.Email);
            return response.Success ? Ok(response) : BadRequest(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending OTP");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Verify OTP code
    /// </summary>
    [HttpPost("verify-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto request)
    {
        try
        {
            var response = await _authService.VerifyOtpAsync(request.Email, request.OtpCode);
            return response.Success ? Ok(response) : BadRequest(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying OTP");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Register new user account
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra khi đăng ký" });
        }
    }

    /// <summary>
    /// Send OTP for forgot password
    /// </summary>
    [HttpPost("forgot-password/send-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> SendForgotPasswordOtp([FromBody] SendOtpRequestDto request)
    {
        try
        {
            var response = await _authService.SendForgotPasswordOtpAsync(request.Email);
            return response.Success ? Ok(response) : BadRequest(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending forgot password OTP");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Verify OTP for forgot password
    /// </summary>
    [HttpPost("forgot-password/verify-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyForgotPasswordOtp([FromBody] VerifyOtpRequestDto request)
    {
        try
        {
            var response = await _authService.VerifyForgotPasswordOtpAsync(request.Email, request.OtpCode);
            return response.Success ? Ok(response) : BadRequest(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying forgot password OTP");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Reset password
    /// </summary>
    [HttpPost("forgot-password/reset")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.Email, request.NewPassword);
            return Ok(new { message = "Đặt lại mật khẩu thành công" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            var msg = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment()
                ? ex.Message
                : "Đã có lỗi xảy ra";
            return StatusCode(500, new { message = msg });
        }
    }

    /// <summary>
    /// Login with Google - callback endpoint
    /// </summary>
    [HttpPost("google/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleCallback([FromBody] GoogleCallbackDto request)
    {
        try
        {
            var response = await _authService.LoginWithGoogleAsync(request.Code);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google login");
            return StatusCode(500, new { message = "Đăng nhập Google thất bại" });
        }
    }

    /// <summary>
    /// Get Google OAuth URL
    /// </summary>
    [HttpGet("google/url")]
    [AllowAnonymous]
    public IActionResult GetGoogleAuthUrl()
    {
        var clientId = HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Google:ClientId"];
        var redirectUri = HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Google:RedirectUri"];
        
        var url = $"https://accounts.google.com/o/oauth2/v2/auth?" +
                  $"client_id={clientId}&" +
                  $"redirect_uri={Uri.EscapeDataString(redirectUri!)}&" +
                  $"response_type=code&" +
                  $"scope={Uri.EscapeDataString("openid email profile")}&" +
                  $"access_type=offline&" +
                  $"prompt=consent";

        return Ok(new { url });
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request.RefreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Logout - revoke refresh token
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request)
    {
        try
        {
            await _authService.LogoutAsync(request.RefreshToken);
            return Ok(new { message = "Đăng xuất thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Change password for logged-in user (requires current password)
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        try
        {
            if (request.NewPassword != request.ConfirmNewPassword)
                return BadRequest(new { message = "Mật khẩu xác nhận không khớp" });

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Không xác định được người dùng" });

            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            bool isCandidate = roles.Contains("CANDIDATE");

            await _authService.ChangePasswordAsync(userId, isCandidate, request.CurrentPassword, request.NewPassword);
            return Ok(new { message = "Đổi mật khẩu thành công" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
        }
    }

    /// <summary>
    /// Upload avatar cho người dùng đang đăng nhập
    /// </summary>
    [HttpPost("upload-avatar")]
    [Authorize]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn file ảnh" });

            // Validate extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG, WEBP" });

            // Validate size (5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Kích thước ảnh quá lớn (tối đa 5MB)" });

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Không xác định được người dùng" });

            var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            bool isCandidate = roles.Contains("CANDIDATE");

            using var stream = file.OpenReadStream();
            var fileName = $"avatar_{userId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            
            var avatarUrl = await _authService.UploadAvatarAsync(userId, isCandidate, stream, fileName);

            return Ok(new
            {
                AvatarUrl = avatarUrl,
                Message = "Tải ảnh đại diện thành công"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar");
            return StatusCode(500, new { message = "Đã có lỗi xảy ra khi tải ảnh lên" });
        }
    }

    /// <summary>
    /// Get current user info
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Không xác định được người dùng" });

        // Get avatar URL from database
        string? avatarUrl = null;
        bool isCandidate = roles.Contains("CANDIDATE");
        
        if (isCandidate)
        {
            var candidate = await _context.Candidates.FindAsync(int.Parse(userId));
            avatarUrl = candidate?.AvatarUrl;
        }
        else
        {
            var user = await _context.Users.FindAsync(int.Parse(userId));
            avatarUrl = user?.AvatarUrl;
        }

        return Ok(new
        {
            id = userId,
            email,
            name,
            roles,
            avatarUrl
        });
    }
}
