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
    /// <summary>
    /// (Tuỳ chọn) Danh sách interviewer cho vòng tiếp theo.
    /// Nếu để trống, vòng mới sẽ được tạo không có người phỏng vấn; HR sẽ gửi yêu cầu đề cử như vòng đầu.
    /// </summary>
    public List<int>? InterviewerIds { get; set; }
}

/// <summary>
/// Yêu cầu lên lịch vòng phỏng vấn tiếp theo theo lô (nhiều hồ sơ cùng vị trí).
/// </summary>
public class NextRoundBatchScheduleRequestDto
{
    /// <summary>Id JobRequest (vị trí) để tham chiếu / logging (tuỳ chọn, không bắt buộc).</summary>
    public int? JobRequestId { get; set; }

    /// <summary>Danh sách ApplicationId cần lên lịch vòng tiếp theo.</summary>
    public List<int> ApplicationIds { get; set; } = new();

    /// <summary>Thời gian bắt đầu buổi đầu tiên.</summary>
    public DateTime StartTime { get; set; }

    /// <summary>Độ dài mỗi buổi (phút).</summary>
    public int DurationMinutes { get; set; } = 30;

    /// <summary>Khoảng nghỉ giữa 2 buổi (phút).</summary>
    public int BreakMinutes { get; set; } = 0;

    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
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
