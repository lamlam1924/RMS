using RMS.Dto.Common;

namespace RMS.Dto.HR;

public class JobRequestListDto
{
    public int Id { get; set; }
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public string RequestedByName { get; set; } = "";
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
    public string CurrentStatus { get; set; } = "";
    public int StatusId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class JobRequestDetailDto : JobRequestListDto
{
    public List<StatusHistoryDto> StatusHistory { get; set; } = new();
}

public class UpdateJobRequestStatusDto
{
    public int ToStatusId { get; set; }
    public string Note { get; set; } = string.Empty;
}
