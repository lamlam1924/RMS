using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Department
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int? HeadUserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public virtual User? HeadUser { get; set; }

    public virtual ICollection<ParticipantRequest> ParticipantRequests { get; set; } = new List<ParticipantRequest>();

    public virtual ICollection<Position> Positions { get; set; } = new List<Position>();

    public virtual ICollection<UserDepartment> UserDepartments { get; set; } = new List<UserDepartment>();
}
