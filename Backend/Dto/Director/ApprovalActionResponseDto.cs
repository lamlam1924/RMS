namespace RMS.Dto.Director;

public class ApprovalActionResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? NewStatus { get; set; }
}
