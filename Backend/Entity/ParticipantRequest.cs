using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class ParticipantRequest
{
    public int Id { get; set; }

    public int? InterviewId { get; set; }

    public int RequestedByUserId { get; set; }

    public int AssignedToUserId { get; set; }

    public int RequiredCount { get; set; }

    public string? Message { get; set; }

    public int StatusId { get; set; }

    public int? ForwardedToUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public DateTime? TimeRangeStart { get; set; }

    public DateTime? TimeRangeEnd { get; set; }

    public string? PositionTitle { get; set; }

    public int? DepartmentId { get; set; }

    public string? TitleLabel { get; set; }

    public virtual User AssignedToUser { get; set; } = null!;

    public virtual Department? Department { get; set; }

    public virtual User? ForwardedToUser { get; set; }

    public virtual User RequestedByUser { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;

    public virtual ICollection<Interview> Interviews { get; set; } = new List<Interview>();
}
