using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class InterviewRoundDecision
{
    public int InterviewId { get; set; }

    public string DecisionCode { get; set; } = null!;

    public string? Note { get; set; }

    public int DecidedBy { get; set; }

    public DateTime DecidedAt { get; set; }

    public virtual User DecidedByNavigation { get; set; } = null!;

    public virtual Interview Interview { get; set; } = null!;
}
