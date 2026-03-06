using System;

namespace RMS.Dto.Director;

public class ApprovalHistoryDto
{
    public int FromStatusId { get; set; }
    public int ToStatusId { get; set; }
    public string? StatusName { get; set; } // Map từ ToStatus.Name
    public required string ChangedByName { get; set; }
    public string? ChangedByRole { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Comment { get; set; } // Map từ Note
}
