namespace RMS.Dto.HR;

/// <summary>
/// DTO for interview conflict information
/// </summary>
public class InterviewConflictDto
{
    public int? ConflictingInterviewId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public string CandidateName { get; set; } = "";
    public DateTime ConflictStart { get; set; }
    public DateTime ConflictEnd { get; set; }
    public string ConflictType { get; set; } = ""; // "INTERVIEWER" | "CANDIDATE"
    public string Severity { get; set; } = ""; // "WARNING" | "ERROR"
}

/// <summary>
/// Result of conflict check
/// </summary>
public class ConflictCheckResultDto
{
    public bool HasConflicts { get; set; }
    public List<InterviewConflictDto> Conflicts { get; set; } = new();
    public bool CanProceed { get; set; }
}

/// <summary>
/// Available time slot for interview scheduling
/// </summary>
public class TimeSlotDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public List<int> AvailableInterviewerIds { get; set; } = new();
    public int ConflictCount { get; set; }
}

/// <summary>
/// Request DTO for checking conflicts
/// </summary>
public class CheckConflictRequestDto
{
    public int ApplicationId { get; set; }
    public List<int> InterviewerIds { get; set; } = new();
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int? ExcludeInterviewId { get; set; }
}

/// <summary>
/// Request DTO for finding available time slots
/// </summary>
public class FindTimeSlotsRequestDto
{
    public List<int> InterviewerIds { get; set; } = new();
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public int DurationMinutes { get; set; }
}
