using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class UserDepartment
{
    public int UserId { get; set; }

    public int DepartmentId { get; set; }

    public bool? IsPrimary { get; set; }

    public DateOnly? JoinedAt { get; set; }

    public DateOnly? LeftAt { get; set; }

    public virtual Department Department { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
