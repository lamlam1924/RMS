using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Service.Interface;

namespace RMS.Controller;

/// <summary>
/// Dev Controller - ONLY for development/testing
/// REMOVE in production!
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DevController : ControllerBase
{
    private readonly ICandidateApplicationService _candidateApplicationService;
    private readonly IWebHostEnvironment _environment;

    public DevController(ICandidateApplicationService candidateApplicationService, IWebHostEnvironment environment)
    {
        _candidateApplicationService = candidateApplicationService;
        _environment = environment;
    }

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

    /// <summary>
    /// Backfill CV snapshots for historical applications (development only)
    /// </summary>
    [HttpPost("backfill-application-cv-snapshots")]
    public async Task<ActionResult<ApplicationCvSnapshotBackfillResultDto>> BackfillApplicationCvSnapshots()
    {
        if (!_environment.IsDevelopment())
            return NotFound();

        var result = await _candidateApplicationService.BackfillApplicationCvSnapshotsAsync();
        return Ok(result);
    }
}

public class VerifyPasswordRequest
{
    public string Password { get; set; } = null!;
    public string Hash { get; set; } = null!;
}
