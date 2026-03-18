using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IDeptManagerInterviewsRepository
{
    Task<List<Interview>> GetInterviewsByManagerIdAsync(int managerId);
    Task<List<Interview>> GetUpcomingInterviewsByManagerIdAsync(int managerId);
    Task<Interview?> GetInterviewByIdAsync(int id, int managerId);
    Task<bool> IsInterviewParticipantAsync(int interviewId, int managerId);
    Task<InterviewFeedback?> GetFeedbackByInterviewerAsync(int interviewId, int interviewerId);
    Task<InterviewFeedback> CreateFeedbackAsync(InterviewFeedback feedback);
    Task<bool> AddInterviewScoresAsync(List<InterviewScore> scores);
    Task<bool> UpdateApplicationStatusAsync(int applicationId, int statusId, int updatedBy, string? comment);
    Task<List<EvaluationCriterion>> GetEvaluationCriteriaByPositionAsync(int positionId);
}
