using RMS.Dto.HR;

namespace RMS.Dto.DepartmentManager;

public class DeptManagerNominationHistoryUserDto : SimpleUserDto
{
    /// <summary>PENDING | CONFIRMED | DECLINED</summary>
    public string ParticipationStatus { get; set; } = "PENDING";
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? DeclinedAt { get; set; }
    public string? DeclineNote { get; set; }
}

public class DeptManagerNominationHistoryItemDto
{
    public int InterviewId { get; set; }
    public int? RequestId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Note { get; set; }

    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }

    public List<DeptManagerNominationHistoryUserDto> NominatedUsers { get; set; } = new();
}

