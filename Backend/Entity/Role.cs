using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Role
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int? ParentRoleId { get; set; }

    public virtual ICollection<Role> InverseParentRole { get; set; } = new List<Role>();

    public virtual Role? ParentRole { get; set; }

    public virtual ICollection<WorkflowTransition> WorkflowTransitions { get; set; } = new List<WorkflowTransition>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
