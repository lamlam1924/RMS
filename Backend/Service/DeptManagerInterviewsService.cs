using AutoMapper;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
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
        var entities = await _repository.GetInterviewsByManagerIdAsync(managerId);
        var dtos = _mapper.Map<List<DeptManagerInterviewListDto>>(entities);
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.HasMyFeedback = entity.InterviewFeedbacks.Any(f => f.InterviewerId == managerId);
            var me = entity.InterviewParticipants?.FirstOrDefault(p => p.UserId == managerId);
            dto.MyConfirmedAt = me?.ConfirmedAt;
            dto.MyDeclinedAt = me?.DeclinedAt;
        }
        return dtos;
    }

    public async Task<List<DeptManagerInterviewListDto>> GetUpcomingInterviewsAsync(int managerId)
    {
        var entities = await _repository.GetUpcomingInterviewsByManagerIdAsync(managerId);
        var dtos = _mapper.Map<List<DeptManagerInterviewListDto>>(entities);
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.HasMyFeedback = entity.InterviewFeedbacks.Any(f => f.InterviewerId == managerId);
            var me = entity.InterviewParticipants?.FirstOrDefault(p => p.UserId == managerId);
            dto.MyConfirmedAt = me?.ConfirmedAt;
            dto.MyDeclinedAt = me?.DeclinedAt;
        }
        return dtos;
    }

    public async Task<DeptManagerInterviewDetailDto?> GetInterviewDetailAsync(int id, int managerId)
    {
        var interview = await _repository.GetInterviewByIdAsync(id, managerId);
        if (interview == null) return null;

        var dto = _mapper.Map<DeptManagerInterviewDetailDto>(interview);

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
