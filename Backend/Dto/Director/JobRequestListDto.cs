using System;

namespace RMS.Dto.Director;

public class JobRequestListDto
{
    public int Id { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public required string RequestedByName { get; set; }
    public int Quantity { get; set; }
    public required string CurrentStatus { get; set; }
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}
