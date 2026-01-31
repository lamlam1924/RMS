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
}

public class CreateJobPostingDto
{
    public int PositionId { get; set; }
    public int Quantity { get; set; }
    public string Description { get; set; } = "";
    public decimal? Budget { get; set; }
    public DateTime? Deadline { get; set; }
}

public class CloseJobPostingDto
{
    public int JobPostingId { get; set; }
    public string Reason { get; set; } = "";
}
