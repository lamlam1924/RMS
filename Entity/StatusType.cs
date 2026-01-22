using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class StatusType
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<Status> Statuses { get; set; } = new List<Status>();

    public virtual ICollection<WorkflowTransition> WorkflowTransitions { get; set; } = new List<WorkflowTransition>();
}
