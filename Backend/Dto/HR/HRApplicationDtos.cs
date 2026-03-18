using RMS.Dto.Common;

namespace RMS.Dto.HR;

public class ApplicationListDto
{
    public int Id { get; set; }
    public int JobRequestId { get; set; }
    public string CandidateName { get; set; } = "";
    public string? CandidateEmail { get; set; }
    public string? CandidatePhone { get; set; }
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public int StatusId { get; set; }
    public string CurrentStatus { get; set; } = "";
    public int? Priority { get; set; }
    public DateTime AppliedDate { get; set; }
    public int? YearsOfExperience { get; set; }
}

public class ApplicationDetailDto : ApplicationListDto
{
    public int CandidateId { get; set; }
    public string? Phone { get; set; }
    public string? CVFileName { get; set; }
    public string? CvUrl { get; set; }
    public string? ProfessionalTitle { get; set; }
    public string? Summary { get; set; }
    public string? SkillsText { get; set; }
    public string? Address { get; set; }
    public string? RejectionReason { get; set; }
    public List<ApplicationCvExperienceDto> Experiences { get; set; } = new();
    public List<ApplicationCvEducationDto> Educations { get; set; } = new();
    public List<ApplicationCvCertificateDto> Certificates { get; set; } = new();
    public List<StatusHistoryDto> StatusHistory { get; set; } = new();
}

public class ApplicationCvExperienceDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = "";
    public string JobTitle { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}

public class ApplicationCvEducationDto
{
    public int Id { get; set; }
    public string SchoolName { get; set; } = "";
    public string? Degree { get; set; }
    public string? Major { get; set; }
    public int? StartYear { get; set; }
    public int? EndYear { get; set; }
    public decimal? Gpa { get; set; }
}

public class ApplicationCvCertificateDto
{
    public int Id { get; set; }
    public string CertificateName { get; set; } = "";
    public string? Issuer { get; set; }
    public int? IssuedYear { get; set; }
}

public class UpdateApplicationStatusDto
{
    public int ApplicationId { get; set; }
    public int ToStatusId { get; set; }
    public string? Note { get; set; }
}
