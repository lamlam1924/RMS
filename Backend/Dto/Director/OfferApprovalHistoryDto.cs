using System;

namespace RMS.Dto.Director;

public class OfferApprovalHistoryDto
{
    public required string ApproverName { get; set; }
    public string? ApproverRole { get; set; }
    public required string Decision { get; set; }
    public string? Comment { get; set; }
    public DateTime ApprovedAt { get; set; }
}
