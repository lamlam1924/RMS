using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Candidate;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Service.Interface;

namespace RMS.Controller;

/// <summary>
/// Phỏng vấn dành cho interviewer — xem lịch và nộp feedback (mọi role được phân công)
/// </summary>
[ApiController]
[Route("api/interviewer/interviews")]
[Authorize(Roles = "EMPLOYEE,DEPARTMENT_MANAGER,DIRECTOR,HR_MANAGER,HR_STAFF")]
public class InterviewerInterviewsController : ControllerBase
{
    private readonly IDeptManagerInterviewsService _service;

    public InterviewerInterviewsController(IDeptManagerInterviewsService service)
    {
        _service = service;
    }

    /// <summary>Lấy danh sách phỏng vấn mà mình được phân công tham gia</summary>
    [HttpGet]
    public async Task<ActionResult<List<DeptManagerInterviewListDto>>> GetMyInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        return Ok(await _service.GetInterviewsAsync(userId));
    }

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra của mình</summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<List<DeptManagerInterviewListDto>>> GetUpcomingInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        return Ok(await _service.GetUpcomingInterviewsAsync(userId));
    }

    /// <summary>Lấy chi tiết buổi phỏng vấn (bao gồm hồ sơ candidate và tiêu chí đánh giá)</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DeptManagerInterviewDetailDto>> GetInterviewDetail(int id)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        var detail = await _service.GetInterviewDetailAsync(id, userId);
        return detail == null ? NotFound(new { message = "Không tìm thấy phỏng vấn hoặc bạn không được phân công" }) : Ok(detail);
    }

    /// <summary>Xác nhận hoặc từ chối tham gia phỏng vấn (CONFIRM / DECLINE)</summary>
    [HttpPost("{id}/respond")]
    public async Task<ActionResult<ActionResponseDto>> RespondToParticipation(int id, [FromBody] RespondInterviewDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        var result = await _service.RespondToParticipationAsync(id, userId, dto?.Response ?? "", dto?.Note);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Nộp feedback sau buổi phỏng vấn (quyết định PASS/REJECT và ghi chú)</summary>
    [HttpPost("{id}/feedback")]
    public async Task<ActionResult<ActionResponseDto>> SubmitInterviewFeedback(
        int id, [FromBody] SubmitInterviewFeedbackDto feedback)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        if (userId == 0) return Unauthorized(new { message = "Invalid user" });
        var result = await _service.SubmitInterviewFeedbackAsync(id, feedback, userId);
        return result.Success ? Ok(result) : BadRequest(new { message = result.Message });
    }
}
