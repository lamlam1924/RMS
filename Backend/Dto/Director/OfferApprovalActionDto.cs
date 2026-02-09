namespace RMS.Dto.Director;

public class OfferApprovalActionDto
{
    public int OfferId { get; set; }
    public string Action { get; set; } = string.Empty; // Server-side populated
    public string? Comment { get; set; }
}
