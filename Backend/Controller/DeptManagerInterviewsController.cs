using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.DepartmentManager;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/dept-manager/interviews")]
[Authorize(Roles = "DEPARTMENT_MANAGER")]
public class DeptManagerInterviewsController : ControllerBase
{
    private readonly IDeptManagerInterviewsService _service;

    public DeptManagerInterviewsController(IDeptManagerInterviewsService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all interviews where this manager is a participant
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<DeptManagerInterviewListDto>>> GetInterviews()
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var interviews = await _service.GetInterviewsAsync(managerId);
        return Ok(interviews);
    }

    /// <summary>
    /// Get upcoming interviews for this manager
    /// </summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<List<DeptManagerInterviewListDto>>> GetUpcomingInterviews()
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var interviews = await _service.GetUpcomingInterviewsAsync(managerId);
        return Ok(interviews);
    }

    /// <summary>
    /// Get detailed information of a specific interview
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DeptManagerInterviewDetailDto>> GetInterviewDetail(int id)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var detail = await _service.GetInterviewDetailAsync(id, managerId);
        if (detail == null)
            return NotFound(new { message = "Interview not found or access denied" });

        return Ok(detail);
    }

    /// <summary>
    /// Submit interview feedback and evaluation
    /// </summary>
    [HttpPost("{id}/feedback")]
    public async Task<ActionResult> SubmitInterviewFeedback(
        int id, [FromBody] SubmitInterviewFeedbackDto feedback)
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.SubmitInterviewFeedbackAsync(id, feedback, managerId);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }
}
