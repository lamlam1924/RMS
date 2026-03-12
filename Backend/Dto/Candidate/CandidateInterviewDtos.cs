namespace RMS.Dto.Candidate;

public class CandidateInterviewListDto
{
    public int Id { get; set; }
    public int RoundNo { get; set; }
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public string StatusCode { get; set; } = "";
    public string StatusName { get; set; } = "";
}

public class RespondInterviewDto
{
    /// <summary>CONFIRM hoặc DECLINE</summary>
    public string Response { get; set; } = "";
}
