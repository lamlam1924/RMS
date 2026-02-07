namespace RMS.Dto.HR;

public class JobPostingListDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public int Quantity { get; set; }
    public int StatusId { get; set; }
    public string CurrentStatus { get; set; } = "";
    public DateTime? PublishedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    // Link to request
    public int JobRequestId { get; set; }
}

public class JobPostingDetailDto : JobPostingListDto
{
    public string? Description { get; set; }
    public string? Requirements { get; set; }
    public string? Benefits { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string? Location { get; set; }
    public DateTime? Deadline { get; set; }
}

public class CreateJobPostingDto
{
    public int JobRequestId { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Requirements { get; set; }
    public string? Benefits { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string? Location { get; set; }
    public DateTime? Deadline { get; set; }
}

public class UpdateJobPostingDto
{
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Requirements { get; set; }
    public string? Benefits { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string? Location { get; set; }
    public DateTime? Deadline { get; set; }
}

public class CloseJobPostingDto
{
    public int JobPostingId { get; set; }
    public string Reason { get; set; } = "";
}
