using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/job-requests")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HRJobRequestsController : ControllerBase
{
    private readonly IHRJobRequestsService _hrJobRequestsService;

    public HRJobRequestsController(IHRJobRequestsService hrJobRequestsService)
    {
        _hrJobRequestsService = hrJobRequestsService;
    }

    /// <summary>
    /// Get all job requests
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<JobRequestListDto>>> GetJobRequests()
    {
        try
        {
            var jobRequests = await _hrJobRequestsService.GetJobRequestsAsync();
            return Ok(jobRequests);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load job requests", error = ex.Message });
        }
    }

    /// <summary>
    /// Get pending job requests
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<List<JobRequestListDto>>> GetPendingJobRequests()
    {
        try
        {
            var jobRequests = await _hrJobRequestsService.GetPendingJobRequestsAsync();
            return Ok(jobRequests);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load pending job requests", error = ex.Message });
        }
    }

    /// <summary>
    /// Get job request by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<JobRequestDetailDto>> GetJobRequestById(int id)
    {
        try
        {
            var jobRequest = await _hrJobRequestsService.GetJobRequestByIdAsync(id);
            if (jobRequest == null)
            {
                return NotFound(new { message = "Job request not found" });
            }
            return Ok(jobRequest);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load job request", error = ex.Message });
        }
    }

    /// <summary>
    /// Update job request status (Approve/Reject)
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult<ActionResponseDto>> UpdateStatus(int id, [FromBody] UpdateJobRequestStatusDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobRequestsService.UpdateStatusAsync(id, dto.ToStatusId, dto.Note, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update status", error = ex.Message });
        }
    }
}
