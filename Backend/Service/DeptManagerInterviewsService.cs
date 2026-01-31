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
        try
        {
            // Validate participation
            var isParticipant = await _repository.IsInterviewParticipantAsync(interviewId, managerId);
            if (!isParticipant)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "You are not a participant in this interview");
            }

            // Check if already submitted feedback
            var existingFeedback = await _repository.GetFeedbackByInterviewerAsync(interviewId, managerId);
            if (existingFeedback != null)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "You have already submitted feedback for this interview");
            }

            // Create interview feedback
            var interviewFeedback = new InterviewFeedback
            {
                InterviewId = interviewId,
                InterviewerId = managerId,
                CreatedAt = DateTimeHelper.Now
            };

            await _context.InterviewFeedbacks.AddAsync(interviewFeedback);
            await _context.SaveChangesAsync();

            // Create scores for each criterion
            if (feedback.Scores != null && feedback.Scores.Any())
            {
                var scores = feedback.Scores.Select(s => new InterviewScore
                {
                    FeedbackId = interviewFeedback.Id,
                    CriteriaId = s.CriterionId,
                    Score = s.Score
                }).ToList();

                await _context.InterviewScores.AddRangeAsync(scores);
            }

            await _context.SaveChangesAsync();

            // Update application status if decision is PASS or REJECT
            if (feedback.Decision == "PASS" || feedback.Decision == "REJECT")
            {
                var interview = await _context.Interviews
                    .Include(i => i.Application)
                    .FirstOrDefaultAsync(i => i.Id == interviewId);

                if (interview?.Application != null)
                {
                    var newStatusCode = feedback.Decision == "PASS" ? "INTERVIEW_PASSED" : "INTERVIEW_FAILED";
                    var newStatus = await _context.Statuses
                        .FirstOrDefaultAsync(s => s.Code == newStatusCode && s.StatusTypeId == 2);

                    if (newStatus != null)
                    {
                        await _repository.UpdateApplicationStatusAsync(
                            interview.Application.Id, newStatus.Id, managerId, feedback.Comment);
                    }
                }
            }

            return ResponseHelper.CreateActionResponse(true,
                "Feedback submitted successfully", "");
        }
        catch (Exception ex)
        {
            return ResponseHelper.CreateActionResponse(false,
                "", $"Error submitting feedback: {ex.Message}");
        }
    }
}
