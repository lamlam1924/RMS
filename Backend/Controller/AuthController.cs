using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.Auth;
using RMS.Service;

namespace RMS.Controller;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
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
            return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
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
    /// Get current user info
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();

        return Ok(new
        {
            id = userId,
            email,
            name,
            roles
        });
    }
}
