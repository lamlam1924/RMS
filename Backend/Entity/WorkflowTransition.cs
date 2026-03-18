using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class WorkflowTransition
{
    public int Id { get; set; }

    public int StatusTypeId { get; set; }

    public int FromStatusId { get; set; }

    public int ToStatusId { get; set; }

    public int RequiredRoleId { get; set; }

    public virtual Status FromStatus { get; set; } = null!;

    public virtual Role RequiredRole { get; set; } = null!;

    public virtual StatusType StatusType { get; set; } = null!;

    public virtual Status ToStatus { get; set; } = null!;
}
