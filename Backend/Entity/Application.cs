using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Application
{
    public int Id { get; set; }

    public int JobRequestId { get; set; }

    public int CvprofileId { get; set; }

    public int StatusId { get; set; }

    public int Priority { get; set; }

    public DateTime? AppliedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public int NoShowCount { get; set; }

    public virtual Cvprofile Cvprofile { get; set; } = null!;

    public virtual ICollection<Interview> Interviews { get; set; } = new List<Interview>();

    public virtual JobRequest JobRequest { get; set; } = null!;

    public virtual ICollection<Offer> Offers { get; set; } = new List<Offer>();

    public virtual Status Status { get; set; } = null!;
}
