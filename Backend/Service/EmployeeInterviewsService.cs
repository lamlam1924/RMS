using AutoMapper;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Common;
using RMS.Dto.Employee;
using RMS.Entity;
using RMS.Repository;

namespace RMS.Service;

public class EmployeeInterviewsService : IEmployeeInterviewsService
{
    private readonly IEmployeeInterviewsRepository _repository;
    private readonly RecruitmentDbContext _context;
    private readonly IMapper _mapper;

    public EmployeeInterviewsService(
        IEmployeeInterviewsRepository repository,
        RecruitmentDbContext context,
        IMapper mapper)
    {
        _repository = repository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<EmployeeInterviewListDto>> GetMyInterviewsAsync(int userId)
    {
        var interviews = await _repository.GetInterviewsByParticipantIdAsync(userId);
        var dtos = _mapper.Map<List<EmployeeInterviewListDto>>(interviews);

        // Set HasMyFeedback for each interview
        foreach (var dto in dtos)
        {
            var feedback = await _repository.GetFeedbackByInterviewerAsync(dto.Id, userId);
            dto.HasMyFeedback = feedback != null;
        }

        return dtos;
    }

    public async Task<List<EmployeeInterviewListDto>> GetUpcomingInterviewsAsync(int userId)
    {
        var interviews = await _repository.GetUpcomingInterviewsByParticipantIdAsync(userId);
        var dtos = _mapper.Map<List<EmployeeInterviewListDto>>(interviews);

        // Set HasMyFeedback for each interview
        foreach (var dto in dtos)
        {
            var feedback = await _repository.GetFeedbackByInterviewerAsync(dto.Id, userId);
            dto.HasMyFeedback = feedback != null;
        }

        return dtos;
    }

    public async Task<EmployeeInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int userId)
    {
        // Check if user is assigned to this interview
        var isParticipant = await _repository.IsInterviewParticipantAsync(interviewId, userId);
        if (!isParticipant)
        {
            return null;
        }

        var interview = await _repository.GetInterviewByIdAsync(interviewId);
        if (interview == null)
        {
            return null;
        }

        var dto = _mapper.Map<EmployeeInterviewDetailDto>(interview);

        // Load evaluation criteria
        var criteria = await _repository.GetEvaluationCriteriaByPositionAsync(
            interview.Application.JobRequest.PositionId);
        dto.EvaluationCriteria = _mapper.Map<List<EvaluationCriterionDto>>(criteria);

        // Check if current user already submitted feedback
        var myFeedback = await _repository.GetFeedbackByInterviewerAsync(interviewId, userId);
        dto.HasMyFeedback = myFeedback != null;

        return dto;
    }

    public async Task<ActionResponseDto> SubmitInterviewFeedbackAsync(
        int interviewId, 
        int userId, 
        SubmitInterviewFeedbackDto dto)
    {
        // Validate participant
        var isParticipant = await _repository.IsInterviewParticipantAsync(interviewId, userId);
        if (!isParticipant)
        {
            return ResponseHelper.CreateActionResponse(
                false, 
                "", 
                "You are not assigned to this interview"
            );
        }

        // Check if already submitted
        var existingFeedback = await _repository.GetFeedbackByInterviewerAsync(interviewId, userId);
        if (existingFeedback != null)
        {
            return ResponseHelper.CreateActionResponse(
                false,
                "",
                "You have already submitted feedback for this interview"
            );
        }

        // Get interview to access application
        var interview = await _repository.GetInterviewByIdAsync(interviewId);
        if (interview == null)
        {
            return ResponseHelper.CreateActionResponse(false, "", "Interview not found");
        }

        // Create feedback
        var feedback = new InterviewFeedback
        {
            InterviewId = interviewId,
            InterviewerId = userId,
            CreatedAt = DateTimeHelper.Now
        };

        await _repository.CreateFeedbackAsync(feedback);

        // Add scores if provided
        if (dto.Scores != null && dto.Scores.Count > 0)
        {
            var scores = dto.Scores.Select(s => new InterviewScore
            {
                FeedbackId = feedback.Id,
                CriteriaId = s.CriteriaId,
                Score = s.Score
            }).ToList();

            await _repository.AddInterviewScoresAsync(scores);
        }

        // Update application status based on decision
        if (dto.Decision.ToUpper() == "PASS")
        {
            // Find PASSED status
            var passedStatus = _context.Statuses
                .FirstOrDefault(s => s.Code == "PASSED" && s.StatusTypeId == 3);
            if (passedStatus != null)
            {
                await _repository.UpdateApplicationStatusAsync(interview.ApplicationId, passedStatus.Id);
            }
        }
        else if (dto.Decision.ToUpper() == "REJECT")
        {
            // Find REJECTED status
            var rejectedStatus = _context.Statuses
                .FirstOrDefault(s => s.Code == "REJECTED" && s.StatusTypeId == 3);
            if (rejectedStatus != null)
            {
                await _repository.UpdateApplicationStatusAsync(interview.ApplicationId, rejectedStatus.Id);
            }
        }

        return ResponseHelper.CreateActionResponse(
            true,
            "Interview feedback submitted successfully",
            ""
        );
    }
}
