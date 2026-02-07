using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/job-postings")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HRJobPostingsController : ControllerBase
{
    private readonly IHRJobPostingsService _hrJobPostingsService;

    public HRJobPostingsController(IHRJobPostingsService hrJobPostingsService)
    {
        _hrJobPostingsService = hrJobPostingsService;
    }

    /// <summary>
    /// Get all job postings
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<JobPostingListDto>>> GetJobPostings()
    {
        try
        {
            var jobPostings = await _hrJobPostingsService.GetJobPostingsAsync();
            return Ok(jobPostings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load job postings", error = ex.Message });
        }
    }

    /// <summary>
    /// Get draft job postings (HR Staff only)
    /// </summary>
    [HttpGet("drafts")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult<List<JobPostingListDto>>> GetDraftJobPostings()
    {
        try
        {
            var jobPostings = await _hrJobPostingsService.GetDraftJobPostingsAsync();
            return Ok(jobPostings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load draft job postings", error = ex.Message });
        }
    }

    /// <summary>
    /// Get job posting detail
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<JobPostingDetailDto>> GetJobPosting(int id)
    {
        try
        {
            var jobPosting = await _hrJobPostingsService.GetJobPostingByIdAsync(id);
            if (jobPosting == null) return NotFound();
            return Ok(jobPosting);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load job posting", error = ex.Message });
        }
    }

    /// <summary>
    /// Create new job posting
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ActionResponseDto>> CreateJobPosting([FromBody] CreateJobPostingDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobPostingsService.CreateJobPostingAsync(dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create job posting", error = ex.Message });
        }
    }

    /// <summary>
    /// Update job posting
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> UpdateJobPosting(int id, [FromBody] UpdateJobPostingDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobPostingsService.UpdateJobPostingAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update job posting", error = ex.Message });
        }
    }

    /// <summary>
    /// Publish job posting (HR Staff action)
    /// </summary>
    [HttpPut("{id}/publish")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> PublishJobPosting(int id)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobPostingsService.PublishJobPostingAsync(id, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to publish job posting", error = ex.Message });
        }
    }

    /// <summary>
    /// Close job posting (HR Manager action)
    /// </summary>
    [HttpPut("{id}/close")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<ActionResponseDto>> CloseJobPosting(
        int id, [FromBody] CloseJobPostingDto dto)
    {
        try
        {
            dto.JobPostingId = id;
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobPostingsService.CloseJobPostingAsync(dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to close job posting", error = ex.Message });
        }
    }
}
