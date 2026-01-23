using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Position
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public int DepartmentId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Department Department { get; set; } = null!;

    public virtual ICollection<JobRequest> JobRequests { get; set; } = new List<JobRequest>();
}
