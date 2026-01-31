using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Director;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/director/job-requests")]
[Authorize(Roles = "DIRECTOR")]
public class DirectorJobRequestsController : ControllerBase
{
    private readonly IDirectorService _service;

    public DirectorJobRequestsController(IDirectorService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all pending job requests awaiting Director approval
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<List<JobRequestListDto>>> GetPendingJobRequests()
    {
        var jobRequests = await _service.GetPendingJobRequestsAsync();
        return Ok(jobRequests);
    }

    /// <summary>
    /// Get detailed information of a specific job request
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<JobRequestDetailDto>> GetJobRequestDetail(int id)
    {
        var detail = await _service.GetJobRequestDetailAsync(id);
        if (detail == null)
            return NotFound(new { message = "Job request not found" });

        return Ok(detail);
    }

    /// <summary>
    /// Approve a job request
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApprovalActionResponseDto>> ApproveJobRequest(
        int id, [FromBody] JobRequestApprovalActionDto request)
    {
        request.JobRequestId = id;
        request.Action = "APPROVED";

        var directorId = CurrentUserHelper.GetCurrentUserId(this);
        if (directorId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.ApproveJobRequestAsync(request, directorId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Reject a job request
    /// </summary>
    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApprovalActionResponseDto>> RejectJobRequest(
        int id, [FromBody] JobRequestApprovalActionDto request)
    {
        request.JobRequestId = id;
        request.Action = "REJECTED";

        var directorId = CurrentUserHelper.GetCurrentUserId(this);
        if (directorId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.RejectJobRequestAsync(request, directorId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
