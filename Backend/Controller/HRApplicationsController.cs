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
    /// Get applications with optional status filter. HR Staff: chỉ application thuộc job được gán.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ApplicationListDto>>> GetApplications([FromQuery] int? statusId)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var scopeByStaffId = User.IsInRole("HR_MANAGER") ? null : (int?)userId;
            var applications = await _hrApplicationsService.GetApplicationsAsync(statusId, scopeByStaffId);
            return Ok(applications);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tải danh sách hồ sơ ứng tuyển", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể tải chi tiết hồ sơ ứng tuyển", error = ex.Message });
        }
    }

    /// <summary>
    /// Get CV snapshot by application ID
    /// </summary>
    [HttpGet("{id}/cv-snapshot")]
    public async Task<ActionResult<ApplicationCvSnapshotDto>> GetApplicationCvSnapshot(int id)
    {
        try
        {
            var snapshot = await _hrApplicationsService.GetApplicationCvSnapshotAsync(id);
            if (snapshot == null)
            {
                return NotFound(new { message = "Application CV snapshot not found" });
            }
            return Ok(snapshot);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tải CV snapshot của hồ sơ ứng tuyển", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể cập nhật trạng thái hồ sơ", error = ex.Message });
        }
    }
}
