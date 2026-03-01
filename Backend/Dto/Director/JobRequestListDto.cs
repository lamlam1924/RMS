using System;

namespace RMS.Dto.Director;

public class JobRequestListDto
{
    public int Id { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public required string RequestedByName { get; set; }
    public int Quantity { get; set; }
    public required string CurrentStatus { get; set; }  // Display name (e.g. "Đã phê duyệt")
    public required string CurrentStatusCode { get; set; } // Code for filtering (e.g. "APPROVED")
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}
