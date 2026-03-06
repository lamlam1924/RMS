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
    private readonly IMediaService _mediaService;

    public DeptManagerJobRequestsController(IDeptManagerJobRequestsService service, IMediaService mediaService)
    {
        _service = service;
        _mediaService = mediaService;
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
        [FromForm] CreateJobRequestForm form)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.CreateJobRequestAsync(form, managerId);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        // Nếu có file JD, thực hiện upload
        if (form.JdFile != null && result.Data is DeptManagerJobRequestDetailDto createdDto)
        {
            try 
            {
                using var fileStream = form.JdFile.OpenReadStream();
                await _mediaService.UploadFileAsync(fileStream, form.JdFile.FileName, "JOB_DESCRIPTION", createdDto.Id, "JOB_REQUEST");
                // Refresh data to include JdFileUrl
                var refreshed = await _service.GetJobRequestDetailAsync(createdDto.Id, managerId);
                result.Data = refreshed;
            }
            catch (Exception)
            {
                // Log error but maybe don't fail the whole request creation
            }
        }

        return Ok(result);
    }

    /// <summary>
    /// Update an existing job request (only if in DRAFT status)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<DeptManagerJobRequestDetailDto>> UpdateJobRequest(
        int id, [FromBody] UpdateJobRequestDto updateDto)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.UpdateJobRequestAsync(id, updateDto, managerId);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// Upload JD file for a job request
    /// </summary>
    [HttpPost("{id}/upload-jd")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DeptManagerJobRequestDetailDto>> UploadJdFile(
        int id, IFormFile jdFile)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        if (jdFile == null)
            return BadRequest(new { message = "JD file is required" });

        // Check if job request exists and belongs to manager
        var jobRequest = await _service.GetJobRequestDetailAsync(id, managerId);
        if (jobRequest == null)
            return NotFound(new { message = "Job request not found" });

        // Only DRAFT can upload/update JD
        if (jobRequest.StatusCode != "DRAFT")
            return BadRequest(new { message = "Only draft job requests can update JD file" });

        try
        {
            using var fileStream = jdFile.OpenReadStream();
            await _mediaService.UploadFileAsync(fileStream, jdFile.FileName, "JOB_DESCRIPTION", id, "JOB_REQUEST");
            
            // Return refreshed data with JD URL
            var refreshed = await _service.GetJobRequestDetailAsync(id, managerId);
            return Ok(refreshed);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Failed to upload JD file: {ex.Message}" });
        }
    }

    /// <summary>
    /// Submit a job request for approval (DRAFT -> SUBMITTED)
    /// </summary>
    [HttpPost("{id}/submit")]
    public async Task<ActionResult> SubmitJobRequest(int id, [FromBody] NoteDto? body = null)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.SubmitJobRequestAsync(id, managerId, body?.Note);
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
    /// <summary>
    /// Reopen a returned job request to edit (Move from RETURNED to DRAFT)
    /// </summary>
    [HttpPost("{id}/reopen")]
    public async Task<IActionResult> Reopen(int id)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        var response = await _service.ReopenReturnedRequestAsync(id, managerId);
        
        if (!response.Success)
        {
            return BadRequest(response);
        }
        
        return Ok(response);
    }

    /// <summary>
    /// Cancel a job request.
    /// DRAFT/RETURNED → CANCELLED directly.
    /// SUBMITTED/IN_REVIEW → CANCEL_PENDING (awaits HR approval).
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelJobRequest(int id, [FromBody] NoteDto? body = null)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.CancelJobRequestAsync(id, managerId, body?.Note);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }
}

