namespace RMS.Dto.Candidate;

/// <summary>
/// CV Profile response DTO for candidate
/// </summary>
public class CandidateCvProfileDto
{
    public int Id { get; set; }
    public int CandidateId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Summary { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? Source { get; set; }
    public string? CvFileUrl { get; set; }
    public DateTime? CreatedAt { get; set; }

    public List<CvExperienceDto> Experiences { get; set; } = new();
    public List<CvEducationDto> Educations { get; set; } = new();
    public List<CvCertificateDto> Certificates { get; set; } = new();
}

public class CvExperienceDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}

public class CvEducationDto
{
    public int Id { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public string? Major { get; set; }
    public int? StartYear { get; set; }
    public int? EndYear { get; set; }
    public decimal? Gpa { get; set; }
}

public class CvCertificateDto
{
    public int Id { get; set; }
    public string CertificateName { get; set; } = string.Empty;
    public string? Issuer { get; set; }
    public int? IssuedYear { get; set; }
}

/// <summary>
/// Create/Update CV Profile request DTO
/// </summary>
public class SaveCvProfileRequestDto
{
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Summary { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? Source { get; set; }

    public List<SaveCvExperienceDto> Experiences { get; set; } = new();
    public List<SaveCvEducationDto> Educations { get; set; } = new();
    public List<SaveCvCertificateDto> Certificates { get; set; } = new();
}

public class SaveCvExperienceDto
{
    public int? Id { get; set; }
    public string CompanyName { get; set; } = null!;
    public string JobTitle { get; set; } = null!;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}

public class SaveCvEducationDto
{
    public int? Id { get; set; }
    public string SchoolName { get; set; } = null!;
    public string? Degree { get; set; }
    public string? Major { get; set; }
    public int? StartYear { get; set; }
    public int? EndYear { get; set; }
    public decimal? Gpa { get; set; }
}

public class SaveCvCertificateDto
{
    public int? Id { get; set; }
    public string CertificateName { get; set; } = null!;
    public string? Issuer { get; set; }
    public int? IssuedYear { get; set; }
}
