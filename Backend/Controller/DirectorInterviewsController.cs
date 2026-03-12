using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/director/interviews")]
[Authorize(Roles = "DIRECTOR")]
public class DirectorInterviewsController : ControllerBase
{
    private readonly IDeptManagerInterviewsService _interviewsService;
    private readonly IParticipantRequestService _requestService;

    public DirectorInterviewsController(
        IDeptManagerInterviewsService interviewsService,
        IParticipantRequestService requestService)
    {
        _interviewsService = interviewsService;
        _requestService = requestService;
    }

    // ==================== Phỏng vấn của Giám đốc (với tư cách interviewer) ====================

    [HttpGet]
    public async Task<ActionResult<List<DeptManagerInterviewListDto>>> GetMyInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        return Ok(await _interviewsService.GetInterviewsAsync(userId));
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<List<DeptManagerInterviewListDto>>> GetUpcomingInterviews()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        return Ok(await _interviewsService.GetUpcomingInterviewsAsync(userId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DeptManagerInterviewDetailDto>> GetInterviewDetail(int id)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var detail = await _interviewsService.GetInterviewDetailAsync(id, userId);
        return detail == null ? NotFound() : Ok(detail);
    }

    [HttpPost("{id}/feedback")]
    public async Task<ActionResult> SubmitFeedback(int id, [FromBody] SubmitInterviewFeedbackDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _interviewsService.SubmitInterviewFeedbackAsync(id, dto, userId);
        return result.Success ? Ok(result) : BadRequest(new { message = result.Message });
    }

    // ==================== Yêu cầu đề cử chuyển tiếp từ HR Manager ====================

    [HttpGet("participant-requests")]
    public async Task<ActionResult<List<ParticipantRequestDto>>> GetForwardedRequests()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        return Ok(await _requestService.GetForwardedToMeAsync(userId));
    }

    [HttpGet("participant-requests/{reqId}")]
    public async Task<ActionResult<ParticipantRequestDto>> GetRequestById(int reqId)
    {
        var dto = await _requestService.GetByIdAsync(reqId);
        return dto == null ? NotFound() : Ok(dto);
    }

    [HttpPost("participant-requests/{reqId}/nominate")]
    public async Task<ActionResult<ActionResponseDto>> Nominate(
        int reqId, [FromBody] NominateParticipantsDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _requestService.NominateAsync(reqId, dto.UserIds, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
