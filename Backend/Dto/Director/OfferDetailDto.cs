using System;
using System.Collections.Generic;

namespace RMS.Dto.Director;

public class OfferDetailDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public required string CandidateName { get; set; }
    public required string CandidateEmail { get; set; }
    public required string CandidatePhone { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public decimal ProposedSalary { get; set; }
    public DateTime? StartDate { get; set; }
    public string? Benefits { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OfferApprovalHistoryDto> ApprovalHistory { get; set; } = new();
}
