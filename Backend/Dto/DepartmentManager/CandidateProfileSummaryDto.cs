namespace RMS.Dto.DepartmentManager;

public class CandidateProfileSummaryDto
{
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public string? Summary { get; set; }
    public string? Source { get; set; }
    public int YearsOfExperience { get; set; }
    public string? CvFileUrl { get; set; }
    public List<CandidateCvExperienceDto> Experiences { get; set; } = new();
    public List<CandidateCvEducationDto> Educations { get; set; } = new();
    public List<CandidateCertificateDto> Certificates { get; set; } = new();
}

public class CandidateCvExperienceDto
{
    public string CompanyName { get; set; } = "";
    public string JobTitle { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}

public class CandidateCvEducationDto
{
    public string SchoolName { get; set; } = "";
    public string? Degree { get; set; }
    public string? Major { get; set; }
    public int? StartYear { get; set; }
    public int? EndYear { get; set; }
    public decimal? Gpa { get; set; }
    public string? Location { get; set; }
}

public class CandidateCertificateDto
{
    public string CertificateName { get; set; } = "";
    public string? Issuer { get; set; }
    public int? IssuedYear { get; set; }
}
