using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class ParticipantRequest
{
    public int Id { get; set; }

    public int InterviewId { get; set; }

    public int RequestedByUserId { get; set; }

    public int AssignedToUserId { get; set; }

    public int RequiredCount { get; set; }

    public string? Message { get; set; }

    public string Status { get; set; } = null!;

    public int? ForwardedToUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public virtual User AssignedToUser { get; set; } = null!;

    public virtual User? ForwardedToUser { get; set; }

    public virtual Interview Interview { get; set; } = null!;

    public virtual User RequestedByUser { get; set; } = null!;
}
