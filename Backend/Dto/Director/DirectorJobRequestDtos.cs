namespace RMS.Dto.Director;

public class JobRequestListDto
{
    public int Id { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public required string RequestedByName { get; set; }
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class JobRequestDetailDto
{
    public int Id { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public required string RequestedByName { get; set; }
    public required string RequestedByEmail { get; set; }
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ApprovalHistoryDto> ApprovalHistory { get; set; } = new();
}

public class JobRequestApprovalActionDto
{
    public int JobRequestId { get; set; }
    public string? Action { get; set; }
    public string? Comment { get; set; }
}
