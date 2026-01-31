using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/applications")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HRApplicationsController : ControllerBase
{
    private readonly IHRApplicationsService _hrApplicationsService;

    public HRApplicationsController(IHRApplicationsService hrApplicationsService)
    {
        _hrApplicationsService = hrApplicationsService;
    }

    /// <summary>
    /// Get applications with optional status filter
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ApplicationListDto>>> GetApplications([FromQuery] int? statusId)
    {
        try
        {
            var applications = await _hrApplicationsService.GetApplicationsAsync(statusId);
            return Ok(applications);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load applications", error = ex.Message });
        }
    }

    /// <summary>
    /// Get application by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApplicationDetailDto>> GetApplicationById(int id)
    {
        try
        {
            var application = await _hrApplicationsService.GetApplicationByIdAsync(id);
            if (application == null)
            {
                return NotFound(new { message = "Application not found" });
            }
            return Ok(application);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load application", error = ex.Message });
        }
    }

    /// <summary>
    /// Update application status
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult<ActionResponseDto>> UpdateApplicationStatus(
        int id, [FromBody] UpdateApplicationStatusDto dto)
    {
        try
        {
            dto.ApplicationId = id;
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrApplicationsService.UpdateApplicationStatusAsync(dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update application status", error = ex.Message });
        }
    }
}
