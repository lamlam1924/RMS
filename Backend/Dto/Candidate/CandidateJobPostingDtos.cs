namespace RMS.Dto.Candidate;

/// <summary>
/// DTO cho danh sách job postings công khai
/// </summary>
public class PublicJobPostingListDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public string Location { get; set; } = "";
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public DateTime? DeadlineDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO cho chi tiết job posting
/// </summary>
public class PublicJobPostingDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Requirements { get; set; } = "";
    public string Benefits { get; set; } = "";
    
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public string Location { get; set; } = "";
    
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public DateTime? DeadlineDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? JdFileUrl { get; set; }
}
