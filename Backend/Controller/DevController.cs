using Microsoft.AspNetCore.Mvc;
using RMS.Common;

namespace RMS.Controller;

/// <summary>
/// Dev Controller - ONLY for development/testing
/// REMOVE in production!
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DevController : ControllerBase
{
    /// <summary>
    /// Hash a password - for testing only
    /// </summary>
    [HttpPost("hash-password")]
    public IActionResult HashPassword([FromBody] string password)
    {
        var hash = PasswordHelper.HashPassword(password);
        return Ok(new { password, hash });
    }

    /// <summary>
    /// Verify a password against hash - for testing only
    /// </summary>
    [HttpPost("verify-password")]
    public IActionResult VerifyPassword([FromBody] VerifyPasswordRequest request)
    {
        var isValid = PasswordHelper.VerifyPassword(request.Password, request.Hash);
        return Ok(new { isValid });
    }
}

public class VerifyPasswordRequest
{
    public string Password { get; set; } = null!;
    public string Hash { get; set; } = null!;
}
