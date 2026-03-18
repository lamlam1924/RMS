using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.Employee;
using RMS.Service;

namespace RMS.Controller;

/// <summary>
/// Employee Interviews - View assigned interviews and submit feedback
/// </summary>
[ApiController]
[Route("api/employee/interviews")]
[Authorize(Roles = "EMPLOYEE")]
public class EmployeeInterviewsController : ControllerBase
{
    private readonly IEmployeeInterviewsService _service;

    public EmployeeInterviewsController(IEmployeeInterviewsService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all interviews where current employee is assigned as participant
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var interviews = await _service.GetMyInterviewsAsync(userId);
        return Ok(interviews);
    }

    /// <summary>
    /// Get upcoming interviews (next 7 days)
    /// </summary>
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var interviews = await _service.GetUpcomingInterviewsAsync(userId);
        return Ok(interviews);
    }

    /// <summary>
    /// Get interview detail with candidate info and evaluation criteria
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetInterviewDetail(int id)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var detail = await _service.GetInterviewDetailAsync(id, userId);
        
        if (detail == null)
        {
            return NotFound(new { message = "Interview not found or you are not assigned to this interview" });
        }
        
        return Ok(detail);
    }

    /// <summary>
    /// Submit interview feedback and scores
    /// </summary>
    [HttpPost("{id}/feedback")]
    public async Task<IActionResult> SubmitFeedback(int id, [FromBody] SubmitInterviewFeedbackDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _service.SubmitInterviewFeedbackAsync(id, userId, dto);
        return Ok(result);
    }
}
