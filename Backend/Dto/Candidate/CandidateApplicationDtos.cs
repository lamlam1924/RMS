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
}
