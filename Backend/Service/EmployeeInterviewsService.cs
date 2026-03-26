using AutoMapper;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.Employee;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class EmployeeInterviewsService : IEmployeeInterviewsService
{
    private readonly IDeptManagerInterviewsRepository _repository;
    private readonly IInterviewFeedbackSubmissionService _feedbackSubmissionService;
    private readonly IMapper _mapper;

    public EmployeeInterviewsService(
        IDeptManagerInterviewsRepository repository,
        IInterviewFeedbackSubmissionService feedbackSubmissionService,
        IMapper mapper)
    {
        _repository = repository;
        _feedbackSubmissionService = feedbackSubmissionService;
        _mapper = mapper;
    }

    public async Task<List<EmployeeInterviewListDto>> GetInterviewsAsync(int userId)
    {
        var entities = await _repository.GetInterviewsByManagerIdAsync(userId);
        var dtos = _mapper.Map<List<EmployeeInterviewListDto>>(entities);
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.HasMyFeedback = entity.InterviewFeedbacks.Any(f => f.InterviewerId == userId);
            var me = entity.InterviewParticipants?.FirstOrDefault(p => p.UserId == userId);
            dto.MyConfirmedAt = me?.ConfirmedAt;
            dto.MyDeclinedAt = me?.DeclinedAt;
            dto.ParticipantRequestId = entity.Requests != null && entity.Requests.Count > 0
                ? entity.Requests.Min(r => r.Id)
                : null;
        }
        return dtos;
    }

    public async Task<List<EmployeeInterviewListDto>> GetUpcomingInterviewsAsync(int userId)
    {
        var entities = await _repository.GetUpcomingInterviewsByManagerIdAsync(userId);
        var dtos = _mapper.Map<List<EmployeeInterviewListDto>>(entities);
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.HasMyFeedback = entity.InterviewFeedbacks.Any(f => f.InterviewerId == userId);
            var me = entity.InterviewParticipants?.FirstOrDefault(p => p.UserId == userId);
            dto.MyConfirmedAt = me?.ConfirmedAt;
            dto.MyDeclinedAt = me?.DeclinedAt;
            dto.ParticipantRequestId = entity.Requests != null && entity.Requests.Count > 0
                ? entity.Requests.Min(r => r.Id)
                : null;
        }
        return dtos;
    }

    public async Task<EmployeeInterviewDetailDto?> GetInterviewDetailAsync(int id, int userId)
    {
        var interview = await _repository.GetInterviewByIdAsync(id, userId);
        if (interview == null) return null;

        var dto = _mapper.Map<EmployeeInterviewDetailDto>(interview);
        if (dto.Candidate == null)
            dto.Candidate = new CandidateProfileDto();
        var feedback = await _repository.GetFeedbackByInterviewerAsync(id, userId);
        dto.HasMyFeedback = feedback != null;
        var me = interview.InterviewParticipants?.FirstOrDefault(p => p.UserId == userId);
        dto.MyConfirmedAt = me?.ConfirmedAt;
        dto.MyDeclinedAt = me?.DeclinedAt;

        if (interview.Application?.JobRequest?.PositionId != null)
        {
            var criteria = await _repository.GetEvaluationCriteriaByPositionAsync(
                interview.Application.JobRequest.PositionId,
                interview.RoundNo);
            dto.EvaluationCriteria = _mapper.Map<List<EvaluationCriterionDto>>(criteria);
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
        int interviewId, SubmitInterviewFeedbackDto feedback, int userId)
    {
        if (!await _repository.IsInterviewParticipantAsync(interviewId, userId))
            return ResponseHelper.CreateActionResponse(false, "", "Bạn không được phân công vào phỏng vấn này");

        if (!await _repository.ParticipantHasConfirmedParticipationAsync(interviewId, userId))
            return ResponseHelper.CreateActionResponse(false, "", "Chỉ có thể nộp đánh giá sau khi xác nhận tham gia buổi phỏng vấn");

        if (await _repository.GetFeedbackByInterviewerAsync(interviewId, userId) != null)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn đã gửi đánh giá cho phỏng vấn này rồi");

        await _feedbackSubmissionService.SubmitAsync(
            interviewId,
            userId,
            feedback.Decision,
            feedback.Comment);

        return ResponseHelper.CreateActionResponse(true, "Đánh giá đã được ghi nhận", "");
    }
}
