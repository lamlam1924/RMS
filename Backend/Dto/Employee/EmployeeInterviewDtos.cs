namespace RMS.Dto.Employee;

/// <summary>
/// Employee interview list item DTO
/// </summary>
public class EmployeeInterviewListDto
{
    public int Id { get; set; }
    public int RoundNo { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public string StatusCode { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    
    // Candidate info
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    
    // Job info
    public string PositionTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    
    // My feedback status
    public bool HasMyFeedback { get; set; }
}

/// <summary>
/// Employee interview detail DTO
/// </summary>
public class EmployeeInterviewDetailDto
{
    public int Id { get; set; }
    public int RoundNo { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    
    // Candidate profile
    public CandidateProfileDto Candidate { get; set; } = new();
    
    // Job info
    public string PositionTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    
    // Interview panel
    public List<InterviewParticipantDto> Participants { get; set; } = new();
    
    // Evaluation criteria
    public List<EvaluationCriterionDto> EvaluationCriteria { get; set; } = new();
    
    // My feedback
    public bool HasMyFeedback { get; set; }
}

public class CandidateProfileDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Summary { get; set; }
    public int? YearsOfExperience { get; set; }
    
    public List<ExperienceDto> Experiences { get; set; } = new();
    public List<EducationDto> Educations { get; set; } = new();
}

public class ExperienceDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}

public class EducationDto
{
    public string SchoolName { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string? Major { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class InterviewParticipantDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string InterviewRole { get; set; } = string.Empty;
    public bool HasFeedback { get; set; }
}

public class EvaluationCriterionDto
{
    public int Id { get; set; }
    public string CriteriaName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Weight { get; set; }
    public int MaxScore { get; set; }
}

/// <summary>
/// Submit interview feedback DTO (reuse from DepartmentManager)
/// </summary>
public class SubmitInterviewFeedbackDto
{
    public string Decision { get; set; } = string.Empty; // PASS or REJECT
    public string? Comment { get; set; }
    public List<InterviewScoreDto> Scores { get; set; } = new();
}

public class InterviewScoreDto
{
    public int CriteriaId { get; set; }
    public decimal Score { get; set; }
    public string? Comment { get; set; }
}
