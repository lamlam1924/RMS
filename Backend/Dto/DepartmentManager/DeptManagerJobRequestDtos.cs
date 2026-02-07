namespace RMS.Dto.DepartmentManager;

// Dashboard DTOs
public class DeptManagerDashboardStatsDto
{
    public int MyJobRequests { get; set; }
    public int PendingApproval { get; set; }
    public int UpcomingInterviews { get; set; }
    public int ActiveCandidates { get; set; }
}

// Job Request DTOs
public class DeptManagerJobRequestListDto
{
    public int Id { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
    public required string StatusCode { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DeptManagerJobRequestDetailDto
{
    public int Id { get; set; }
    public int PositionId { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public required string RequestedByName { get; set; }
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
    public required string StatusCode { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<DeptManagerStatusHistoryDto> StatusHistory { get; set; } = new();
}

public class CreateJobRequestDto
{
    public int PositionId { get; set; }
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}

public class UpdateJobRequestDto
{
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}

// Note: Có một Common.StatusHistoryDto dùng cho internal mapping
// DTO này là phiên bản simplified cho Department Manager API responses
public class DeptManagerStatusHistoryDto
{
    public required string FromStatus { get; set; }
    public required string ToStatus { get; set; }
    public required string ChangedByName { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Comment { get; set; }
}

public class ApplicationSummaryDto
{
    public int Id { get; set; }
    public required string CandidateName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public required string StatusCode { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime AppliedDate { get; set; }
}
