using AutoMapper;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class DeptManagerInterviewsService : IDeptManagerInterviewsService
{
    private readonly IDeptManagerInterviewsRepository _repository;
    private readonly IInterviewFeedbackSubmissionService _feedbackSubmissionService;
    private readonly IMapper _mapper;

    public DeptManagerInterviewsService(
        IDeptManagerInterviewsRepository repository,
        IInterviewFeedbackSubmissionService feedbackSubmissionService,
        IMapper mapper)
    {
        _repository = repository;
        _feedbackSubmissionService = feedbackSubmissionService;
        _mapper = mapper;
    }

    public async Task<List<DeptManagerInterviewListDto>> GetInterviewsAsync(int managerId)
    {
        var asParticipant = await _repository.GetInterviewsByManagerIdAsync(managerId);
        var nominatedIds = await _repository.GetInterviewIdsNominatedByManagerAsync(managerId);
        var participantSet = asParticipant.Select(x => x.Id).ToHashSet();
        var extraIds = nominatedIds.Where(id => !participantSet.Contains(id)).ToList();
        var extra = extraIds.Count == 0
            ? new List<Interview>()
            : await _repository.GetInterviewsByIdsAsync(extraIds);

        var merged = asParticipant.Concat(extra).OrderByDescending(i => i.StartTime).ToList();
        var dtos = _mapper.Map<List<DeptManagerInterviewListDto>>(merged);
        foreach (var dto in dtos)
        {
            var entity = merged.First(e => e.Id == dto.Id);
            FillListRow(dto, entity, managerId);
        }
        return dtos;
    }

    public async Task<List<DeptManagerInterviewListDto>> GetUpcomingInterviewsAsync(int managerId)
    {
        var participant = await _repository.GetUpcomingInterviewsByManagerIdAsync(managerId);
        var nominatedIds = await _repository.GetInterviewIdsNominatedByManagerAsync(managerId);
        var pid = participant.Select(p => p.Id).ToHashSet();
        var missingIds = nominatedIds.Where(id => !pid.Contains(id)).ToList();
        var extra = missingIds.Count == 0
            ? new List<Interview>()
            : await _repository.GetInterviewsByIdsAsync(missingIds);
        var now = DateTimeHelper.Now;
        var extraUpcoming = extra.Where(i => i.StartTime > now).ToList();
        var merged = participant.Concat(extraUpcoming).OrderBy(i => i.StartTime).Take(10).ToList();

        var dtos = _mapper.Map<List<DeptManagerInterviewListDto>>(merged);
        foreach (var dto in dtos)
        {
            var entity = merged.First(e => e.Id == dto.Id);
            FillListRow(dto, entity, managerId);
        }
        return dtos;
    }

    private static void FillListRow(DeptManagerInterviewListDto dto, Interview entity, int managerId)
    {
        var isParticipant = entity.InterviewParticipants?.Any(p => p.UserId == managerId) ?? false;
        dto.IsReadOnlyNominatorAccess = !isParticipant;
        dto.HasMyFeedback = entity.InterviewFeedbacks.Any(f => f.InterviewerId == managerId);
        var me = entity.InterviewParticipants?.FirstOrDefault(p => p.UserId == managerId);
        dto.MyConfirmedAt = me?.ConfirmedAt;
        dto.MyDeclinedAt = me?.DeclinedAt;
        dto.ParticipantRequestId = entity.Requests != null && entity.Requests.Count > 0
            ? entity.Requests.Min(r => r.Id)
            : null;
    }

    public async Task<DeptManagerInterviewDetailDto?> GetInterviewDetailAsync(int id, int managerId)
    {
        var interview = await _repository.GetInterviewByIdAsync(id, managerId);
        if (interview == null) return null;

        var dto = _mapper.Map<DeptManagerInterviewDetailDto>(interview);

        var isParticipant = await _repository.IsInterviewParticipantAsync(id, managerId);
        dto.IsReadOnlyNominatorAccess = !isParticipant;

        if (dto.IsReadOnlyNominatorAccess)
        {
            dto.HasMyFeedback = false;
            dto.MyFeedbackComment = null;
            dto.MyFeedbackRecommendation = null;
            dto.MyConfirmedAt = null;
            dto.MyDeclinedAt = null;
        }
        else
        {
            // Check if current manager has submitted feedback & expose summary for UI
            var feedback = await _repository.GetFeedbackByInterviewerAsync(id, managerId);
            dto.HasMyFeedback = feedback != null;
            if (feedback != null)
            {
                dto.MyFeedbackComment = feedback.Note;
                dto.MyFeedbackRecommendation = feedback.Recommendation;
            }
            var me = interview.InterviewParticipants?.FirstOrDefault(p => p.UserId == managerId);
            dto.MyConfirmedAt = me?.ConfirmedAt;
            dto.MyDeclinedAt = me?.DeclinedAt;
        }

        // Get evaluation criteria for the position
        if (interview.Application?.JobRequest?.PositionId != null)
        {
            var criteria = await _repository.GetEvaluationCriteriaByPositionAsync(
                interview.Application.JobRequest.PositionId,
                interview.RoundNo);
            dto.EvaluationCriteria = _mapper.Map<List<EvaluationCriterionDto>>(criteria);
        }

        // Populate previous rounds for context
        if (interview.RoundNo > 1)
        {
            dto.PreviousRounds = await _repository.GetPreviousRoundsAsync(
                interview.ApplicationId, interview.RoundNo);
        }

        return dto;
    }

    public async Task<ActionResponseDto> RespondToParticipationAsync(int interviewId, int userId, string response, string? note = null)
    {
        var normalized = response?.Trim().ToUpperInvariant();
        if (normalized != "CONFIRM" && normalized != "DECLINE")
            return ResponseHelper.CreateActionResponse(false, "", "Response phải là CONFIRM hoặc DECLINE");

        if (!await _repository.IsInterviewParticipantAsync(interviewId, userId))
            return ResponseHelper.CreateActionResponse(false, "", "Bạn không được phân công vào phỏng vấn này");

        var success = await _repository.RespondToParticipationAsync(interviewId, userId, normalized == "CONFIRM", normalized == "DECLINE" ? note : null);
        return ResponseHelper.CreateActionResponse(
            success,
            success ? (normalized == "CONFIRM" ? "Đã xác nhận tham gia" : "Đã ghi nhận từ chối tham gia") : "",
            success ? "" : "Không thể cập nhật phản hồi");
    }

    public async Task<ActionResponseDto> SubmitInterviewFeedbackAsync(
        int interviewId, SubmitInterviewFeedbackDto feedback, int managerId)
    {
        if (!await _repository.IsInterviewParticipantAsync(interviewId, managerId))
            return ResponseHelper.CreateActionResponse(false, "", "Bạn không được phân công vào phỏng vấn này");

        if (!await _repository.ParticipantHasConfirmedParticipationAsync(interviewId, managerId))
            return ResponseHelper.CreateActionResponse(false, "", "Chỉ có thể nộp đánh giá sau khi xác nhận tham gia buổi phỏng vấn");

        if (await _repository.GetFeedbackByInterviewerAsync(interviewId, managerId) != null)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn đã gửi đánh giá cho phỏng vấn này rồi");

        await _feedbackSubmissionService.SubmitAsync(
            interviewId,
            managerId,
            feedback.Decision,
            feedback.Comment);

        // Không tự đổi Application status — HR sẽ chốt sau khi xem toàn bộ feedback
        return ResponseHelper.CreateActionResponse(true, "Đánh giá đã được ghi nhận", "");
    }
}
