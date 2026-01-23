using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class InterviewParticipant
{
    public int InterviewId { get; set; }

    public int UserId { get; set; }

    public int? InterviewRoleId { get; set; }

    public virtual Interview Interview { get; set; } = null!;

    public virtual InterviewRole? InterviewRole { get; set; }

    public virtual User User { get; set; } = null!;
}
