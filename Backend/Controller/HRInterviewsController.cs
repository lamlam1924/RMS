using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Service;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/interviews")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HRInterviewsController : ControllerBase
{
    private readonly IHRInterviewsService _service;
    private readonly IParticipantRequestService _requestService;
    private readonly IInterviewConflictService _conflictService;
    private readonly IInterviewNoShowService _noShowService;
    private readonly IInterviewMultiRoundService _multiRoundService;

    public HRInterviewsController(
        IHRInterviewsService service,
        IParticipantRequestService requestService,
        IInterviewConflictService conflictService,
        IInterviewNoShowService noShowService,
        IInterviewMultiRoundService multiRoundService)
    {
        _service = service;
        _requestService = requestService;
        _conflictService = conflictService;
        _noShowService = noShowService;
        _multiRoundService = multiRoundService;
    }

    [HttpGet]
    /// <summary>Lấy toàn bộ danh sách phỏng vấn</summary>
    public async Task<ActionResult<List<InterviewListDto>>> GetInterviews()
        => Ok(await _service.GetInterviewsAsync());

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra</summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<List<InterviewListDto>>> GetUpcomingInterviews()
        => Ok(await _service.GetUpcomingInterviewsAsync());

    /// <summary>Lấy chi tiết một buổi phỏng vấn</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<InterviewDetailDto>> GetInterviewDetail(int id)
    {
        var detail = await _service.GetInterviewDetailAsync(id);
        return detail == null ? NotFound() : Ok(detail);
    }

    // ==================== PHASE 1: Conflict Detection ====================

    /// <summary>Check conflicts trước khi tạo hoặc update interview</summary>
    [HttpPost("check-conflicts")]
    public async Task<ActionResult<ConflictCheckResultDto>> CheckConflicts(
        [FromBody] CheckConflictRequestDto dto)
    {
        try
        {
            var result = await _conflictService.CheckAllConflictsAsync(
                dto.ApplicationId,
                dto.InterviewerIds,
                dto.StartTime,
                dto.EndTime,
                dto.ExcludeInterviewId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ResponseHelper.Error(ex.Message));
        }
    }

    /// <summary>Tìm các time slots available cho danh sách interviewer (30-min intervals, 9 AM - 6 PM)</summary>
    [HttpPost("find-available-slots")]
    public async Task<ActionResult<List<TimeSlotDto>>> FindAvailableSlots(
        [FromBody] FindTimeSlotsRequestDto dto)
    {
        try
        {
            var slots = await _conflictService.FindAvailableTimeSlotsAsync(
                dto.InterviewerIds,
                dto.DateFrom,
                dto.DateTo,
                dto.DurationMinutes);
            return Ok(slots);
        }
        catch (Exception ex)
        {
            return BadRequest(ResponseHelper.Error(ex.Message));
        }
    }

    // ==================== Interview CRUD ====================

    /// <summary>Tạo buổi phỏng vấn mới và gửi email thông báo cho candidate và interviewer</summary>
    [HttpPost]
    public async Task<ActionResult<ActionResponseDto>> CreateInterview([FromBody] CreateInterviewDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _service.CreateInterviewAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Cập nhật thông tin buổi phỏng vấn (thời gian, địa điểm, link)</summary>
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

    /// <summary>Huỷ buổi phỏng vấn</summary>
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
        var result = await _service.SubmitInterviewFeedbackAsync(id, dto, userId);
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

    // ==================== PHASE 2: NO-SHOW HANDLING (SIMPLIFIED) ====================

    /// <summary>Đánh dấu buổi phỏng vấn là vắng mặt (candidate hoặc interviewer không đến)</summary>
    [HttpPost("{id}/mark-no-show")]
    public async Task<ActionResult<ActionResponseDto>> MarkNoShow(int id, [FromBody] MarkNoShowRequestDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            dto.InterviewId = id;
            await _noShowService.MarkAsNoShowAsync(dto, userId);
            return Ok(ResponseHelper.Success("Interview marked as no-show successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ResponseHelper.Error(ex.Message));
        }
    }

    /// <summary>Lấy thống kê no-show của một candidate</summary>
    [HttpGet("no-shows/candidate/{candidateId}")]
    public async Task<ActionResult<CandidateNoShowStatsDto>> GetCandidateNoShowStats(int candidateId)
    {
        var stats = await _noShowService.GetCandidateNoShowStatsAsync(candidateId);
        return stats == null ? NotFound() : Ok(stats);
    }

    /// <summary>Lấy tổng hợp thống kê no-show toàn hệ thống</summary>
    [HttpGet("no-shows/statistics")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<NoShowStatisticsSummaryDto>> GetNoShowStatistics()
    {
        var summary = await _noShowService.GetNoShowStatisticsSummaryAsync();
        return Ok(summary);
    }

    /// <summary>Kiểm tra candidate có bị blacklist do no-show quá nhiều lần không</summary>
    [HttpGet("no-shows/candidate/{candidateId}/is-blacklisted")]
    public async Task<ActionResult<bool>> IsCandidateBlacklisted(int candidateId)
    {
        var isBlacklisted = await _noShowService.IsCandidateBlacklistedAsync(candidateId);
        return Ok(isBlacklisted);
    }

    // ==================== PHASE 2: MULTI-ROUND INTERVIEWS ====================

    /// <summary>Kiểm tra phỏng vấn có đủ điều kiện lên lịch vòng tiếp theo không</summary>
    [HttpGet("{id}/check-next-round")]
    public async Task<ActionResult<NextRoundCheckResultDto>> CheckNextRoundEligibility(int id)
    {
        try
        {
            var result = await _multiRoundService.CheckNextRoundEligibilityAsync(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ResponseHelper.Error(ex.Message));
        }
    }

    /// <summary>Lên lịch vòng phỏng vấn tiếp theo dựa trên kết quả vòng trước</summary>
    [HttpPost("{id}/schedule-next-round")]
    public async Task<ActionResult<ActionResponseDto>> ScheduleNextRound(
        int id, [FromBody] ScheduleNextRoundRequestDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            dto.PreviousInterviewId = id;
            var newInterviewId = await _multiRoundService.AutoScheduleNextRoundAsync(id, dto, userId);
            return Ok(ResponseHelper.Success($"Next round scheduled successfully. Interview ID: {newInterviewId}", newInterviewId));
        }
        catch (Exception ex)
        {
            return BadRequest(ResponseHelper.Error(ex.Message));
        }
    }

    /// <summary>HR xem xét và ghi nhận quyết định cho vòng phỏng vấn đã hoàn thành</summary>
    [HttpPost("{id}/review-round")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<InterviewRoundDecisionDto>> ReviewRound(
        int id,
        [FromBody] ReviewInterviewRoundRequestDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var decision = await _multiRoundService.ReviewRoundAsync(id, dto, userId);
            return Ok(decision);
        }
        catch (Exception ex)
        {
            return BadRequest(ResponseHelper.Error(ex.Message));
        }
    }

    /// <summary>Lấy tiến trình các vòng phỏng vấn của một hồ sơ ứng tuyển</summary>
    [HttpGet("application/{applicationId}/round-progress")]
    public async Task<ActionResult<InterviewRoundProgressDto>> GetRoundProgress(int applicationId)
    {
        try
        {
            var progress = await _multiRoundService.GetRoundProgressAsync(applicationId);
            return Ok(progress);
        }
        catch (Exception ex)
        {
            return BadRequest(ResponseHelper.Error(ex.Message));
        }
    }

    /// <summary>Lấy danh sách feedback chưa nộp (có thể lọc theo interviewer hoặc chỉ quá hạn)</summary>
    [HttpGet("pending-feedbacks")]
    public async Task<ActionResult<List<PendingFeedbackDto>>> GetPendingFeedbacks(
        [FromQuery] int? interviewerId = null,
        [FromQuery] bool overdueOnly = false)
    {
        var pendingList = await _multiRoundService.GetPendingFeedbacksAsync(interviewerId, overdueOnly);
        return Ok(pendingList);
    }

    /// <summary>Gửi email nhắc nhở nộp feedback cho các interviewer chưa nộp</summary>
    [HttpPost("{id}/send-feedback-reminder")]
    public async Task<ActionResult<ActionResponseDto>> SendFeedbackReminder(int id)
    {
        var success = await _multiRoundService.SendFeedbackReminderAsync(id);
        return success
            ? Ok(ResponseHelper.Success("Feedback reminder sent successfully"))
            : BadRequest(ResponseHelper.Error("Failed to send feedback reminder"));
    }
}
