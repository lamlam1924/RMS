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
    /// Get job requests by status
    /// </summary>
    [HttpGet("status/{statusCode}")]
    public async Task<ActionResult<List<JobRequestListDto>>> GetJobRequestsByStatus(string statusCode)
    {
        try
        {
            var jobRequests = await _hrJobRequestsService.GetJobRequestsByStatusAsync(statusCode);
            return Ok(jobRequests);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Failed to load job requests with status {statusCode}", error = ex.Message });
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
    /// Forward job request to Director
    /// </summary>
    [HttpPost("{id}/forward")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<IActionResult> ForwardToDirector(int id, [FromBody] HRJobRequestReviewDto reviewDto)

    {
        try
        {
            var hrManagerId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobRequestsService.ForwardToDirectorAsync(id, reviewDto.Note, hrManagerId);
            
            if (!result) return BadRequest(new { message = "Failed to forward job request" });
            
            return Ok(new { message = "Job request forwarded to Director successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error forwarding job request", error = ex.Message });
        }
    }

    /// <summary>
    /// Return job request to Department Manager for revision
    /// </summary>
    [HttpPost("{id}/return")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<IActionResult> ReturnToDeptManager(int id, [FromBody] HRJobRequestReviewDto reviewDto)

    {
        try
        {
            var hrManagerId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobRequestsService.ReturnToDeptManagerAsync(id, reviewDto.Note, hrManagerId);
            
            if (!result) return BadRequest(new { message = "Failed to return job request" });
            
            return Ok(new { message = "Job request returned to Department Manager for revision" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error returning job request", error = ex.Message });
        }
    }

    /// <summary>
    /// Approve a cancel request (CANCEL_PENDING -> CANCELLED)
    /// </summary>
    [HttpPost("{id}/approve-cancel")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<IActionResult> ApproveCancel(int id, [FromBody] HRJobRequestReviewDto? reviewDto = null)
    {
        try
        {
            var hrManagerId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobRequestsService.ApproveCancelAsync(id, reviewDto?.Note, hrManagerId);

            if (!result) return BadRequest(new { message = "Failed to approve cancel request" });

            return Ok(new { message = "Cancel request approved. Job request has been cancelled." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error approving cancel request", error = ex.Message });
        }
    }

    /// <summary>
    /// Reject a cancel request (CANCEL_PENDING -> previous status)
    /// </summary>
    [HttpPost("{id}/reject-cancel")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<IActionResult> RejectCancel(int id, [FromBody] HRJobRequestReviewDto? reviewDto = null)
    {
        try
        {
            var hrManagerId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobRequestsService.RejectCancelAsync(id, reviewDto?.Note, hrManagerId);

            if (!result) return BadRequest(new { message = "Failed to reject cancel request" });

            return Ok(new { message = "Cancel request rejected. Job request restored to previous status." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error rejecting cancel request", error = ex.Message });
        }
    }

    /// <summary>
    /// HR Manager assigns an HR Staff to an APPROVED job request
    /// PUT api/hr/job-requests/{id}/assign
    /// </summary>
    [HttpPut("{id}/assign")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<IActionResult> AssignStaff(int id, [FromBody] AssignStaffToRequestDto dto)
    {
        try
        {
            var managerId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobRequestsService.AssignStaffToJobRequestAsync(id, dto.StaffId, managerId);

            if (!result.Success) return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error assigning staff", error = ex.Message });
        }
    }

    /// <summary>
    /// HR Staff gets APPROVED job requests assigned to themselves
    /// GET api/hr/job-requests/approved-for-me
    /// </summary>
    [HttpGet("approved-for-me")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<IActionResult> GetApprovedForMe()
    {
        try
        {
            var staffId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobRequestsService.GetApprovedJobRequestsForStaffAsync(staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching assigned job requests", error = ex.Message });
        }
    }
}
