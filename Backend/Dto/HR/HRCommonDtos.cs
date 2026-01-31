using RMS.Dto.Common;

namespace RMS.Dto.HR;

// ActionResponseDto moved to RMS.Dto.Common (shared across all modules)
// StatusHistoryDto also available in RMS.Dto.Common for internal mapping

public class StatusHistoryDto
{
    public int? FromStatusId { get; set; }
    public string? FromStatus { get; set; }
    public int ToStatusId { get; set; }
    public string ToStatus { get; set; } = "";
    public string ChangedByName { get; set; } = "";
    public DateTime ChangedAt { get; set; }
    public string? Note { get; set; }
}
