using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Candidate;
using RMS.Dto.Common;
using RMS.Dto.Employee;
using RMS.Service.Interface;

namespace RMS.Controller;

/// <summary>
/// API phỏng vấn cho người được phân công (interviewer). Bất kỳ vai trò nào cũng có thể là interviewer (trừ Admin).
/// </summary>
[ApiController]
[Route("api/employee/interviews")]
[Authorize(Roles = "EMPLOYEE,DEPARTMENT_MANAGER,DIRECTOR,HR_MANAGER,HR_STAFF")]
public class EmployeeInterviewsController : ControllerBase
{
    private readonly IEmployeeInterviewsService _service;

    public EmployeeInterviewsController(IEmployeeInterviewsService service)
    {
        _service = service;
    }

    /// <summary>Lấy danh sách phỏng vấn mà mình được phân công tham gia</summary>
    [HttpGet]
    public async Task<ActionResult<List<EmployeeInterviewListDto>>> GetMyInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        return Ok(await _service.GetInterviewsAsync(userId));
    }

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra</summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<List<EmployeeInterviewListDto>>> GetUpcomingInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        return Ok(await _service.GetUpcomingInterviewsAsync(userId));
    }

    /// <summary>Lấy chi tiết buổi phỏng vấn</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeInterviewDetailDto>> GetInterviewDetail(int id)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        var detail = await _service.GetInterviewDetailAsync(id, userId);
        return detail == null ? NotFound(new { message = "Không tìm thấy phỏng vấn hoặc bạn không được phân công" }) : Ok(detail);
    }

    /// <summary>Xác nhận hoặc từ chối tham gia phỏng vấn (CONFIRM / DECLINE) — dùng từ link trong email</summary>
    [HttpPost("{id}/respond")]
    public async Task<ActionResult<ActionResponseDto>> RespondToParticipation(int id, [FromBody] RespondInterviewDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        var result = await _service.RespondToParticipationAsync(id, userId, dto?.Response ?? "", dto?.Note);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Nộp đánh giá sau buổi phỏng vấn</summary>
    [HttpPost("{id}/feedback")]
    public async Task<ActionResult<ActionResponseDto>> SubmitFeedback(int id, [FromBody] SubmitInterviewFeedbackDto feedback)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        var result = await _service.SubmitInterviewFeedbackAsync(id, feedback, userId);
        return result.Success ? Ok(result) : BadRequest(new { message = result.Message });
    }
}
