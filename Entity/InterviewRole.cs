using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class InterviewRole
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string? Name { get; set; }

    public virtual ICollection<InterviewParticipant> InterviewParticipants { get; set; } = new List<InterviewParticipant>();
}
