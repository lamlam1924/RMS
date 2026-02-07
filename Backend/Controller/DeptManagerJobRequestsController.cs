using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/dept-manager/job-requests")]
[Authorize(Roles = "DEPARTMENT_MANAGER")]
public class DeptManagerJobRequestsController : ControllerBase
{
    private readonly IDeptManagerJobRequestsService _service;

    public DeptManagerJobRequestsController(IDeptManagerJobRequestsService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all job requests created by this department manager
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<DeptManagerJobRequestListDto>>> GetJobRequests()
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var jobRequests = await _service.GetJobRequestsAsync(managerId);
        return Ok(jobRequests);
    }

    /// <summary>    /// Get all positions in the manager's department(s)
    /// </summary>
    [HttpGet("positions")]
    public async Task<ActionResult<List<PositionDto>>> GetPositions()
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var positions = await _service.GetPositionsAsync(managerId);
        return Ok(positions);
    }

    /// <summary>    /// Get detailed information of a specific job request
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DeptManagerJobRequestDetailDto>> GetJobRequestDetail(int id)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var detail = await _service.GetJobRequestDetailAsync(id, managerId);
        if (detail == null)
            return NotFound(new { message = "Job request not found or access denied" });

        return Ok(detail);
    }

    /// <summary>
    /// Create a new job request
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DeptManagerJobRequestDetailDto>> CreateJobRequest(
        [FromBody] CreateJobRequestDto request)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.CreateJobRequestAsync(request, managerId);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// Update an existing job request (only if in DRAFT status)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<DeptManagerJobRequestDetailDto>> UpdateJobRequest(
        int id, [FromBody] UpdateJobRequestDto request)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.UpdateJobRequestAsync(id, request, managerId);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// Submit a job request for approval (DRAFT -> SUBMITTED)
    /// </summary>
    [HttpPost("{id}/submit")]
    public async Task<ActionResult> SubmitJobRequest(int id)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.SubmitJobRequestAsync(id, managerId);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// Delete a job request (only if in DRAFT status)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteJobRequest(int id)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.DeleteJobRequestAsync(id, managerId);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// Get applications for a specific job request
    /// </summary>
    [HttpGet("{jobRequestId}/applications")]
    public async Task<ActionResult<List<ApplicationSummaryDto>>> GetApplicationsByJobRequest(int jobRequestId)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var applications = await _service.GetApplicationsByJobRequestAsync(jobRequestId, managerId);
        return Ok(applications);
    }
}
