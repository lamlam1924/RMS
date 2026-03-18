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
            return StatusCode(500, new { message = "Không thể tải danh sách tin tuyển dụng", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể tải danh sách tin nháp", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể tải chi tiết tin tuyển dụng", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể tạo tin tuyển dụng", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể cập nhật tin tuyển dụng", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể đăng tin tuyển dụng", error = ex.Message });
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
            return StatusCode(500, new { message = "Không thể đóng tin tuyển dụng", error = ex.Message });
        }
    }

    /// <summary>
    /// Get list of HR Staff (for HR Manager to assign)
    /// </summary>
    [HttpGet("staff-list")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<List<HRStaffDto>>> GetHRStaffList()
    {
        try
        {
            var result = await _hrJobPostingsService.GetHRStaffListAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tải danh sách HR Staff", error = ex.Message });
        }
    }

    /// <summary>
    /// Assign HR Staff to job posting (HR Manager action)
    /// </summary>
    [HttpPut("{id}/assign")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<ActionResponseDto>> AssignStaff(int id, [FromBody] AssignStaffDto dto)
    {
        try
        {
            var managerId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobPostingsService.AssignStaffAsync(id, dto, managerId);

            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể phân công HR Staff", error = ex.Message });
        }
    }

    /// <summary>
    /// Get job postings assigned to current HR Staff
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult<List<JobPostingListDto>>> GetMyJobPostings()
    {
        try
        {
            var staffId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrJobPostingsService.GetMyJobPostingsAsync(staffId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Không thể tải danh sách tin được giao", error = ex.Message });
        }
    }
}
