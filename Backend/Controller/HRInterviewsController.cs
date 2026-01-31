using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/interviews")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HRInterviewsController : ControllerBase
{
    private readonly IHRInterviewsService _hrInterviewsService;

    public HRInterviewsController(IHRInterviewsService hrInterviewsService)
    {
        _hrInterviewsService = hrInterviewsService;
    }

    /// <summary>
    /// Get all interviews
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<InterviewListDto>>> GetInterviews()
    {
        try
        {
            var interviews = await _hrInterviewsService.GetInterviewsAsync();
            return Ok(interviews);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load interviews", error = ex.Message });
        }
    }

    /// <summary>
    /// Get upcoming interviews
    /// </summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<List<InterviewListDto>>> GetUpcomingInterviews()
    {
        try
        {
            var interviews = await _hrInterviewsService.GetUpcomingInterviewsAsync();
            return Ok(interviews);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load upcoming interviews", error = ex.Message });
        }
    }

    /// <summary>
    /// Create new interview
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ActionResponseDto>> CreateInterview([FromBody] CreateInterviewDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrInterviewsService.CreateInterviewAsync(dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create interview", error = ex.Message });
        }
    }

    /// <summary>
    /// Update interview
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ActionResponseDto>> UpdateInterview(
        int id, [FromBody] UpdateInterviewDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrInterviewsService.UpdateInterviewAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update interview", error = ex.Message });
        }
    }
}
