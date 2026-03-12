using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class InterviewFeedback
{
    public int Id { get; set; }

    public int InterviewId { get; set; }

    public int InterviewerId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? Note { get; set; }

    public virtual Interview Interview { get; set; } = null!;

    public virtual ICollection<InterviewScore> InterviewScores { get; set; } = new List<InterviewScore>();

    public virtual User Interviewer { get; set; } = null!;
}
