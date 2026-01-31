namespace RMS.Dto.DepartmentManager;

// Interview DTOs
public class DeptManagerInterviewListDto
{
    public int Id { get; set; }
    public int RoundNo { get; set; }
    public required string CandidateName { get; set; }
    public required string PositionTitle { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public required string StatusCode { get; set; }
    public List<InterviewParticipantDto> Participants { get; set; } = new();
}

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
    public bool HasMyFeedback { get; set; }
}

public class InterviewParticipantDto
{
    public required string Name { get; set; }
    public required string Role { get; set; }
    public bool HasFeedback { get; set; }
}

public class CandidateProfileSummaryDto
{
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public string? Summary { get; set; }
    public int YearsOfExperience { get; set; }
}

public class EvaluationCriterionDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public int MaxScore { get; set; }
}

public class SubmitInterviewFeedbackDto
{
    public List<InterviewScoreDto> Scores { get; set; } = new();
    public string? Comment { get; set; }
    public required string Decision { get; set; } // PASS or REJECT
}

public class InterviewScoreDto
{
    public int CriterionId { get; set; }
    public int Score { get; set; }
}
