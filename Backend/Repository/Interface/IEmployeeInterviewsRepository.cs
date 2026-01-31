using RMS.Entity;

namespace RMS.Repository;

/// <summary>
/// Repository for Employee interview data access
/// </summary>
public interface IEmployeeInterviewsRepository
{
    /// <summary>
    /// Get interviews where user is assigned as participant
    /// </summary>
    Task<List<Interview>> GetInterviewsByParticipantIdAsync(int userId);

    /// <summary>
    /// Get upcoming interviews (next 7 days) for participant
    /// </summary>
    Task<List<Interview>> GetUpcomingInterviewsByParticipantIdAsync(int userId);

    /// <summary>
    /// Get interview by ID with full navigation properties
    /// </summary>
    Task<Interview?> GetInterviewByIdAsync(int interviewId);

    /// <summary>
    /// Check if user is assigned to this interview
    /// </summary>
    Task<bool> IsInterviewParticipantAsync(int interviewId, int userId);

    /// <summary>
    /// Check if user already submitted feedback for this interview
    /// </summary>
    Task<InterviewFeedback?> GetFeedbackByInterviewerAsync(int interviewId, int userId);

    /// <summary>
    /// Create interview feedback
    /// </summary>
    Task<InterviewFeedback> CreateFeedbackAsync(InterviewFeedback feedback);

    /// <summary>
    /// Add interview scores
    /// </summary>
    Task AddInterviewScoresAsync(List<InterviewScore> scores);

    /// <summary>
    /// Get evaluation criteria for position
    /// </summary>
    Task<List<EvaluationCriterion>> GetEvaluationCriteriaByPositionAsync(int positionId);

    /// <summary>
    /// Update application status after interview decision
    /// </summary>
    Task UpdateApplicationStatusAsync(int applicationId, int statusId);
}
