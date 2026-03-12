using AutoMapper;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.Employee;
using RMS.Entity;
using RMS.Repository;

namespace RMS.Service;

public class EmployeeInterviewsService : IEmployeeInterviewsService
{
    private readonly IEmployeeInterviewsRepository _repository;
    private readonly IMapper _mapper;

    public EmployeeInterviewsService(
        IEmployeeInterviewsRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<List<EmployeeInterviewListDto>> GetMyInterviewsAsync(int userId)
    {
        var interviews = await _repository.GetInterviewsByParticipantIdAsync(userId);
        var dtos = _mapper.Map<List<EmployeeInterviewListDto>>(interviews);
        foreach (var dto in dtos)
            dto.HasMyFeedback = await _repository.GetFeedbackByInterviewerAsync(dto.Id, userId) != null;
        return dtos;
    }

    public async Task<List<EmployeeInterviewListDto>> GetUpcomingInterviewsAsync(int userId)
    {
        var interviews = await _repository.GetUpcomingInterviewsByParticipantIdAsync(userId);
        var dtos = _mapper.Map<List<EmployeeInterviewListDto>>(interviews);
        foreach (var dto in dtos)
            dto.HasMyFeedback = await _repository.GetFeedbackByInterviewerAsync(dto.Id, userId) != null;
        return dtos;
    }

    public async Task<EmployeeInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int userId)
    {
        if (!await _repository.IsInterviewParticipantAsync(interviewId, userId))
            return null;

        var interview = await _repository.GetInterviewByIdAsync(interviewId);
        if (interview == null) return null;

        var dto = _mapper.Map<EmployeeInterviewDetailDto>(interview);
        var criteria = await _repository.GetEvaluationCriteriaByPositionAsync(
            interview.Application.JobRequest.PositionId);
        dto.EvaluationCriteria = _mapper.Map<List<EvaluationCriterionDto>>(criteria);
        dto.HasMyFeedback = await _repository.GetFeedbackByInterviewerAsync(interviewId, userId) != null;
        return dto;
    }

    public async Task<ActionResponseDto> SubmitInterviewFeedbackAsync(
        int interviewId, int userId, SubmitInterviewFeedbackDto dto)
    {
        if (!await _repository.IsInterviewParticipantAsync(interviewId, userId))
            return ResponseHelper.CreateActionResponse(false, "", "Bạn không được phân công vào phỏng vấn này");

        if (await _repository.GetFeedbackByInterviewerAsync(interviewId, userId) != null)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn đã gửi đánh giá cho phỏng vấn này rồi");

        var interview = await _repository.GetInterviewByIdAsync(interviewId);
        if (interview == null)
            return ResponseHelper.CreateActionResponse(false, "", "Không tìm thấy phỏng vấn");

        var feedback = new InterviewFeedback
        {
            InterviewId  = interviewId,
            InterviewerId = userId,
            Note         = dto.Comment,
            CreatedAt    = DateTimeHelper.Now
        };
        await _repository.CreateFeedbackAsync(feedback);

        if (dto.Scores?.Count > 0)
        {
            var scores = dto.Scores.Select(s => new InterviewScore
            {
                FeedbackId = feedback.Id,
                CriteriaId = s.CriteriaId,
                Score      = s.Score
            }).ToList();
            await _repository.AddInterviewScoresAsync(scores);
        }

        // Không tự đổi Application status — HR sẽ chốt sau khi xem toàn bộ feedback
        return ResponseHelper.CreateActionResponse(true, "Đánh giá đã được ghi nhận", "");
    }
}
