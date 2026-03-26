using System;
using System.Collections.Generic;
using RMS.Dto.Common;

namespace RMS.Dto.DepartmentManager;

public class DeptManagerInterviewDetailDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int RoundNo { get; set; }
    public required string CandidateName { get; set; }
    public required string PositionTitle { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public required string StatusCode { get; set; }
    public List<InterviewParticipantDto> Participants { get; set; } = new();
    public CandidateProfileSummaryDto? CandidateProfile { get; set; }
    public List<EvaluationCriterionDto> EvaluationCriteria { get; set; } = new();

    // My feedback summary (for interviewer to review their own evaluation)
    public bool HasMyFeedback { get; set; }
    public string? MyFeedbackComment { get; set; }
    public string? MyFeedbackRecommendation { get; set; }
    public DateTime? MyConfirmedAt { get; set; }
    public DateTime? MyDeclinedAt { get; set; }
    /// <summary>True when DM opened this interview because they nominated participants but is not an interview participant (read-only: no confirm, no feedback).</summary>
    public bool IsReadOnlyNominatorAccess { get; set; }
    public List<PreviousRoundSummaryDto> PreviousRounds { get; set; } = new();
}

public class PreviousRoundSummaryDto
{
    public int RoundNo { get; set; }
    public int InterviewId { get; set; }
    public DateTime StartTime { get; set; }
    public string StatusCode { get; set; } = "";
    public string StatusName { get; set; } = "";
    public decimal? AverageScore { get; set; }
    public string? DecisionCode { get; set; }
    public string? DecisionNote { get; set; }
}
