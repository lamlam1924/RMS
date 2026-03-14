namespace RMS.Dto.HR;

/// <summary>
/// Request to mark interview as no-show
/// </summary>
public class MarkNoShowRequestDto
{
    public int InterviewId { get; set; }
    
    /// <summary>
    /// Type: CANDIDATE | INTERVIEWER
    /// </summary>
    public string NoShowType { get; set; } = null!;
    
    /// <summary>
    /// For INTERVIEWER no-show, specify which interviewer
    /// </summary>
    public int? UserId { get; set; }
    
    public string? Reason { get; set; }
}

/// <summary>
/// No-show statistics for a candidate
/// </summary>
public class CandidateNoShowStatsDto
{
    public int CandidateId { get; set; }
    public string CandidateName { get; set; } = null!;
    public string CandidateEmail { get; set; } = null!;
    public int TotalNoShows { get; set; }
    public DateTime? LastNoShowDate { get; set; }
    public bool IsBlacklisted { get; set; } // >= 3 no-shows
}

/// <summary>
/// No-show statistics summary (simplified - no detailed logs)
/// </summary>
public class NoShowStatisticsSummaryDto
{
    public int TotalNoShows { get; set; }
    public int CandidateNoShows { get; set; }
    public int InterviewerNoShows { get; set; }
    public List<MonthlyNoShowDto> ByMonth { get; set; } = new();
    public List<CandidateNoShowStatsDto> TopOffenders { get; set; } = new();
}

public class MonthlyNoShowDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int Count { get; set; }
}
