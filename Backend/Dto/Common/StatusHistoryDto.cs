namespace RMS.Dto.Common;

/// <summary>
/// DTO for status change history tracking
/// Used to display status transition logs across entities (JobRequest, Application, Offer, etc.)
/// </summary>
public class StatusHistoryDto
{
    public int? FromStatusId { get; set; }
    public string? FromStatus { get; set; }
    public int ToStatusId { get; set; }
    public string ToStatus { get; set; } = "";
    public int ChangedById { get; set; }
    public string ChangedByName { get; set; } = "";
    public DateTime ChangedAt { get; set; }
    public string? Note { get; set; }
}
