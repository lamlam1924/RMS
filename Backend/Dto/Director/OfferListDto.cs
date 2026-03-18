using System;

namespace RMS.Dto.Director;

public class OfferListDto
{
    public int Id { get; set; }
    public required string CandidateName { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public decimal ProposedSalary { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
}
