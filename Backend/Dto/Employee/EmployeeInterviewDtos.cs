using RMS.Dto.Common;

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

    // Xác nhận tham gia (từ Phỏng vấn của tôi hoặc link trong email)
    public DateTime? MyConfirmedAt { get; set; }
    public DateTime? MyDeclinedAt { get; set; }

    /// <summary>Yêu cầu đề cử HR (batch): nhiều buổi PV cùng block — dùng gom lịch UI.</summary>
    public int? ParticipantRequestId { get; set; }
}

/// <summary>
/// Employee interview detail DTO
/// </summary>
public class EmployeeInterviewDetailDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
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

    // Xác nhận tham gia
    public DateTime? MyConfirmedAt { get; set; }
    public DateTime? MyDeclinedAt { get; set; }
}

public class CandidateProfileDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Summary { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? Source { get; set; }
    public string? CvFileUrl { get; set; }
    
    public List<ExperienceDto> Experiences { get; set; } = new();
    public List<EducationDto> Educations { get; set; } = new();
    public List<CertificateDto> Certificates { get; set; } = new();
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
    public int? StartYear { get; set; }
    public int? EndYear { get; set; }
    public decimal? Gpa { get; set; }
    public string? Location { get; set; }
}

public class CertificateDto
{
    public string CertificateName { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public int? IssuedYear { get; set; }
}

