using System;

namespace RMS.Dto.DepartmentManager;

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
