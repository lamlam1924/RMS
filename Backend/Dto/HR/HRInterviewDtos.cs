namespace RMS.Dto.HR;

public class InterviewListDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public DateTime ScheduledAt { get; set; }
    public string Location { get; set; } = "";
    public string? InterviewType { get; set; }
    public string? Status { get; set; }
}

public class CreateInterviewDto
{
    public int ApplicationId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Location { get; set; } = "";
    public string? InterviewType { get; set; }
    public List<int>? InterviewerIds { get; set; }
}

public class UpdateInterviewDto
{
    public DateTime? ScheduledAt { get; set; }
    public string? Location { get; set; }
    public string? InterviewType { get; set; }
}
