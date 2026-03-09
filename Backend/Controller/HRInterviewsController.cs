using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/interviews")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HRInterviewsController : ControllerBase
{
    private readonly IHRInterviewsService _service;
    private readonly IParticipantRequestService _requestService;
    private readonly IDeptManagerInterviewsService _deptManagerInterviewsService;

    public HRInterviewsController(
        IHRInterviewsService service,
        IParticipantRequestService requestService,
        IDeptManagerInterviewsService deptManagerInterviewsService)
    {
        _service = service;
        _requestService = requestService;
        _deptManagerInterviewsService = deptManagerInterviewsService;
    }

    [HttpGet]
    public async Task<ActionResult<List<InterviewListDto>>> GetInterviews()
        => Ok(await _service.GetInterviewsAsync());

    [HttpGet("upcoming")]
    public async Task<ActionResult<List<InterviewListDto>>> GetUpcomingInterviews()
        => Ok(await _service.GetUpcomingInterviewsAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<InterviewDetailDto>> GetInterviewDetail(int id)
    {
        var detail = await _service.GetInterviewDetailAsync(id);
        return detail == null ? NotFound() : Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<ActionResponseDto>> CreateInterview([FromBody] CreateInterviewDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _service.CreateInterviewAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ActionResponseDto>> UpdateInterview(int id, [FromBody] UpdateInterviewDto dto)
    {
        var result = await _service.UpdateInterviewAsync(id, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>HR chốt kết quả phỏng vấn → Application PASSED/REJECTED</summary>
    [HttpPost("{id}/finalize")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<ActionResponseDto>> FinalizeInterview(int id, [FromBody] FinalizeInterviewDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _service.FinalizeInterviewAsync(id, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<ActionResponseDto>> CancelInterview(int id)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _service.CancelInterviewAsync(id, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ==================== Participant Requests ====================

    /// <summary>HR Staff gửi yêu cầu đề cử người tham gia phỏng vấn đến trưởng phòng ban</summary>
    [HttpPost("{id}/participant-requests")]
    public async Task<ActionResult<ActionResponseDto>> CreateParticipantRequest(
        int id, [FromBody] CreateParticipantRequestDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _requestService.CreateRequestAsync(id, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Lấy danh sách yêu cầu đề cử của một cuộc phỏng vấn</summary>
    [HttpGet("{id}/participant-requests")]
    public async Task<ActionResult<List<ParticipantRequestDto>>> GetParticipantRequests(int id)
        => Ok(await _requestService.GetRequestsByInterviewAsync(id));

    /// <summary>HR Manager xem các yêu cầu được chuyển tiếp đến mình (từ HR Staff của vị trí cấp cao)</summary>
    [HttpGet("participant-requests/assigned")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<List<ParticipantRequestDto>>> GetMyAssignedRequests()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        return Ok(await _requestService.GetMyAssignedRequestsAsync(userId));
    }

    /// <summary>HR Manager chuyển tiếp yêu cầu đề cử lên Director (vị trí cấp cao)</summary>
    [HttpPost("participant-requests/{reqId}/forward")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<ActionResponseDto>> ForwardToDirector(
        int reqId, [FromBody] ForwardRequestDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _requestService.ForwardToDirectorAsync(reqId, dto.ToUserId, dto.Message, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>HR Manager trực tiếp đề cử người tham gia (khi HR Manager tự xử lý yêu cầu)</summary>
    [HttpPost("participant-requests/{reqId}/nominate")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<ActionResponseDto>> Nominate(
        int reqId, [FromBody] NominateParticipantsDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _requestService.NominateAsync(reqId, dto.UserIds, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>HR Staff / HR Manager nộp feedback sau khi tham gia phỏng vấn với tư cách interviewer</summary>
    [HttpPost("{id}/feedback")]
    public async Task<ActionResult> SubmitFeedback(int id, [FromBody] SubmitInterviewFeedbackDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _deptManagerInterviewsService.SubmitInterviewFeedbackAsync(id, dto, userId);
        return result.Success ? Ok(result) : BadRequest(new { message = result.Message });
    }

    // ==================== Utilities ====================

    /// <summary>Lấy danh sách trưởng phòng ban để gửi yêu cầu đề cử</summary>
    [HttpGet("utilities/dept-managers")]
    public async Task<ActionResult<List<SimpleUserDto>>> GetDeptManagers()
        => Ok(await _requestService.GetAllDeptManagersAsync());

    /// <summary>Lấy danh sách Giám đốc để chuyển tiếp yêu cầu (dành cho HR Manager)</summary>
    [HttpGet("utilities/directors")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<List<SimpleUserDto>>> GetDirectors()
        => Ok(await _requestService.GetAllDirectorsAsync());
}
