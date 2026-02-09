namespace RMS.Dto.Director;

public class JobRequestApprovalActionDto
{
    public int JobRequestId { get; set; }
    public string? Action { get; set; } // APPROVED, REJECTED, RETURNED
    public string? Comment { get; set; }
}
