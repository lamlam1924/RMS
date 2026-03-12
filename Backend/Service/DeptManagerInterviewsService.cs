using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class DeptManagerInterviewsService : IDeptManagerInterviewsService
{
    private readonly IDeptManagerInterviewsRepository _repository;
    private readonly RecruitmentDbContext _context;
    private readonly IMapper _mapper;

    public DeptManagerInterviewsService(
        IDeptManagerInterviewsRepository repository,
        RecruitmentDbContext context,
        IMapper mapper)
    {
        _repository = repository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<DeptManagerInterviewListDto>> GetInterviewsAsync(int managerId)
    {
        var entities = await _repository.GetInterviewsByManagerIdAsync(managerId);
        return _mapper.Map<List<DeptManagerInterviewListDto>>(entities);
    }

    public async Task<List<DeptManagerInterviewListDto>> GetUpcomingInterviewsAsync(int managerId)
    {
        var entities = await _repository.GetUpcomingInterviewsByManagerIdAsync(managerId);
        return _mapper.Map<List<DeptManagerInterviewListDto>>(entities);
    }

    public async Task<DeptManagerInterviewDetailDto?> GetInterviewDetailAsync(int id, int managerId)
    {
        var interview = await _repository.GetInterviewByIdAsync(id, managerId);
        if (interview == null) return null;

        var dto = _mapper.Map<DeptManagerInterviewDetailDto>(interview);

        // Check if current manager has submitted feedback
        var feedback = await _repository.GetFeedbackByInterviewerAsync(id, managerId);
        dto.HasMyFeedback = feedback != null;

        // Get evaluation criteria for the position
        if (interview.Application?.JobRequest?.PositionId != null)
        {
            var criteria = await _repository.GetEvaluationCriteriaByPositionAsync(
                interview.Application.JobRequest.PositionId);
            dto.EvaluationCriteria = _mapper.Map<List<EvaluationCriterionDto>>(criteria);
        }

        return dto;
    }

    public async Task<ActionResponseDto> SubmitInterviewFeedbackAsync(
        int interviewId, SubmitInterviewFeedbackDto feedback, int managerId)
    {
        if (!await _repository.IsInterviewParticipantAsync(interviewId, managerId))
            return ResponseHelper.CreateActionResponse(false, "", "Bạn không được phân công vào phỏng vấn này");

        if (await _repository.GetFeedbackByInterviewerAsync(interviewId, managerId) != null)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn đã gửi đánh giá cho phỏng vấn này rồi");

        var interviewFeedback = new InterviewFeedback
        {
            InterviewId   = interviewId,
            InterviewerId = managerId,
            Note          = feedback.Comment,
            CreatedAt     = DateTimeHelper.Now
        };

        await _context.InterviewFeedbacks.AddAsync(interviewFeedback);
        await _context.SaveChangesAsync();

        if (feedback.Scores?.Any() == true)
        {
            var scores = feedback.Scores.Select(s => new InterviewScore
            {
                FeedbackId = interviewFeedback.Id,
                CriteriaId = s.CriterionId,
                Score      = s.Score
            }).ToList();

            await _context.InterviewScores.AddRangeAsync(scores);
            await _context.SaveChangesAsync();
        }

        // Không tự đổi Application status — HR sẽ chốt sau khi xem toàn bộ feedback
        return ResponseHelper.CreateActionResponse(true, "Đánh giá đã được ghi nhận", "");
    }
}
