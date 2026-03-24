namespace RMS.Dto.Common;

public class ApplicationCvSnapshotDto
{
    public int ApplicationId { get; set; }
    public int CvprofileId { get; set; }
    public DateTime? AppliedAt { get; set; }
    public string? CvFileUrl { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? ProfessionalTitle { get; set; }
    public string? Summary { get; set; }
    public string? SkillsText { get; set; }
    public string? ReferencesText { get; set; }
    public int? YearsOfExperience { get; set; }
    public List<ApplicationCvSnapshotExperienceDto> Experiences { get; set; } = new();
    public List<ApplicationCvSnapshotEducationDto> Educations { get; set; } = new();
    public List<ApplicationCvSnapshotCertificateDto> Certificates { get; set; } = new();
}

public class ApplicationCvSnapshotExperienceDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}

public class ApplicationCvSnapshotEducationDto
{
    public int Id { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public string? Major { get; set; }
    public int? StartYear { get; set; }
    public int? EndYear { get; set; }
    public decimal? Gpa { get; set; }
}

public class ApplicationCvSnapshotCertificateDto
{
    public int Id { get; set; }
    public string CertificateName { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public int? IssuedYear { get; set; }
}

public class ApplicationCvSnapshotBackfillResultDto
{
    public int TotalApplicationsScanned { get; set; }
    public int MigratedApplications { get; set; }
}
