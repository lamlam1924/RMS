namespace RMS.Dto.Director;

public class ApprovalHistoryDto
{
    public required string StatusName { get; set; }
    public required string ChangedByName { get; set; }
    public required string ChangedByRole { get; set; }
    public required string Comment { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class OfferApprovalHistoryDto
{
    public required string ApproverName { get; set; }
    public required string ApproverRole { get; set; }
    public required string Decision { get; set; }
    public required string Comment { get; set; }
    public DateTime ApprovedAt { get; set; }
}

public class ApprovalActionResponseDto
{
    public bool Success { get; set; }
    public required string Message { get; set; }
    public string? NewStatus { get; set; }
}
