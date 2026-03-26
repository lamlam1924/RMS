using System;
using System.Collections.Generic;
using RMS.Dto.Common;

namespace RMS.Dto.DepartmentManager;

public class DeptManagerInterviewListDto
{
    public int Id { get; set; }
    public int RoundNo { get; set; }
    public required string CandidateName { get; set; }
    public required string PositionTitle { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public required string StatusCode { get; set; }
    public List<InterviewParticipantDto> Participants { get; set; } = new();
    public bool HasMyFeedback { get; set; }
    public DateTime? MyConfirmedAt { get; set; }
    public DateTime? MyDeclinedAt { get; set; }
    /// <summary>True when DM sees this row because they nominated someone but is not a participant (view-only in detail).</summary>
    public bool IsReadOnlyNominatorAccess { get; set; }

    /// <summary>Yêu cầu đề cử HR (batch): gom các buổi cùng block trên lịch.</summary>
    public int? ParticipantRequestId { get; set; }
}
