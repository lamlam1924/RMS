namespace RMS.Dto.Candidate;

/// <summary>
/// Response sau khi ứng viên apply thành công
/// </summary>
public class CandidateApplyResponseDto
{
    public int ApplicationId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string PositionTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime AppliedAt { get; set; }
    public string? CvFileUrl { get; set; }
}

/// <summary>
/// Danh sách đơn ứng tuyển của candidate
/// </summary>
public class CandidateApplicationListDto
{
    public int Id { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string PositionTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime? AppliedAt { get; set; }
    public string? CvFileUrl { get; set; }
    public string? ProfessionalTitle { get; set; }
    public string? Summary { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? SkillsText { get; set; }
    public int ExperienceCount { get; set; }
    public int EducationCount { get; set; }
    public int CertificateCount { get; set; }
    public string? RejectionReason { get; set; }
}

/// <summary>
/// Chi tiết đơn ứng tuyển của candidate
/// </summary>
public class CandidateApplicationDetailDto : CandidateApplicationListDto
{
    public string? JobDescription { get; set; }
    public string? JobRequirements { get; set; }
    public string? Location { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string? CandidateEmail { get; set; }
    public string? CandidatePhone { get; set; }
    public string? Address { get; set; }
    public List<CandidateApplicationExperienceDto> Experiences { get; set; } = new();
    public List<CandidateApplicationEducationDto> Educations { get; set; } = new();
    public List<CandidateApplicationCertificateDto> Certificates { get; set; } = new();
}

public class CandidateApplicationExperienceDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}

public class CandidateApplicationEducationDto
{
    public int Id { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public string? Major { get; set; }
    public int? StartYear { get; set; }
    public int? EndYear { get; set; }
    public decimal? Gpa { get; set; }
}

public class CandidateApplicationCertificateDto
{
    public int Id { get; set; }
    public string CertificateName { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public int? IssuedYear { get; set; }
}
