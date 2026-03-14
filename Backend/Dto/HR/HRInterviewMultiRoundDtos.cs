namespace RMS.Dto.HR;

/// <summary>
/// Check if interview is ready for next round scheduling
/// </summary>
public class NextRoundCheckRequestDto
{
    public int InterviewId { get; set; }
}

/// <summary>
/// Result of next round check
/// </summary>
public class NextRoundCheckResultDto
{
    public bool ShouldScheduleNextRound { get; set; }
    public int? ApplicationId { get; set; }
    public int? NextRoundNo { get; set; }
    public decimal? AverageScore { get; set; }
    public string Message { get; set; } = null!;
    
    // Additional context
    public bool AllFeedbackSubmitted { get; set; }
    public int TotalInterviewers { get; set; }
    public int SubmittedFeedbacks { get; set; }
    public bool CanReviewRound { get; set; }
    public bool HasDecision { get; set; }
    public InterviewRoundDecisionDto? RoundDecision { get; set; }
    public InterviewRecommendationSummaryDto RecommendationSummary { get; set; } = new();
}

public class ReviewInterviewRoundRequestDto
{
    public string Decision { get; set; } = null!;
    public string? Note { get; set; }
}

public class InterviewRoundDecisionDto
{
    public int InterviewId { get; set; }
    public string DecisionCode { get; set; } = null!;
    public string? Note { get; set; }
    public int DecidedBy { get; set; }
    public string DecidedByName { get; set; } = null!;
    public DateTime DecidedAt { get; set; }
}

public class InterviewRecommendationSummaryDto
{
    public int StrongHireCount { get; set; }
    public int HireCount { get; set; }
    public int NoHireCount { get; set; }
    public int StrongNoHireCount { get; set; }
}

/// <summary>
/// Request to schedule next round interview
/// </summary>
public class ScheduleNextRoundRequestDto
{
    public int PreviousInterviewId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public List<int> InterviewerIds { get; set; } = new();
}

/// <summary>
/// Multi-round interview progress tracking
/// </summary>
public class InterviewRoundProgressDto
{
    public int ApplicationId { get; set; }
    public string CandidateName { get; set; } = null!;
    public string JobTitle { get; set; } = null!;
    
    public int CurrentRound { get; set; }
    public int TotalRoundsCompleted { get; set; }
    
    public List<RoundDetailDto> Rounds { get; set; } = new();
}

public class RoundDetailDto
{
    public int RoundNo { get; set; }
    public int InterviewId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = null!;
    public decimal? AverageScore { get; set; }
    public bool AllFeedbackSubmitted { get; set; }
    public bool IsNextRoundScheduled { get; set; }
    public InterviewRoundDecisionDto? RoundDecision { get; set; }
    public InterviewRecommendationSummaryDto RecommendationSummary { get; set; } = new();
    public List<string> InterviewerNames { get; set; } = new();
}

/// <summary>
/// Pending feedback reminder list
/// </summary>
public class PendingFeedbackDto
{
    public int InterviewId { get; set; }
    public string InterviewTitle { get; set; } = null!;
    public DateTime InterviewDate { get; set; }
    public DateTime? RequiresFeedbackBy { get; set; }
    public bool IsOverdue { get; set; }
    
    public int InterviewerId { get; set; }
    public string InterviewerName { get; set; } = null!;
    public string InterviewerEmail { get; set; } = null!;
    
    public int DaysSinceInterview { get; set; }
}

/// <summary>
/// Snapshot tổng hợp kết quả một vòng phỏng vấn (dùng nội bộ trong service layer)
/// </summary>
public class InterviewRoundSummarySnapshot
{
    public int InterviewId { get; set; }
    public int TotalInterviewers { get; set; }
    public int SubmittedFeedbacks { get; set; }
    public decimal? AverageScore { get; set; }
    public InterviewRecommendationSummaryDto RecommendationSummary { get; set; } = new();
}
