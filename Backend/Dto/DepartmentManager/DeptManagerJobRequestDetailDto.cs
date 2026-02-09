using System;
using System.Collections.Generic;
using RMS.Dto.Common;

namespace RMS.Dto.DepartmentManager;

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
    public string? JdFileUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<StatusHistoryDto> StatusHistory { get; set; } = new();
}
