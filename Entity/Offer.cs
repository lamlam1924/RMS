using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Offer
{
    public int Id { get; set; }

    public int ApplicationId { get; set; }

    public decimal? ProposedSalary { get; set; }

    public int StatusId { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Application Application { get; set; } = null!;

    public virtual ICollection<OfferApproval> OfferApprovals { get; set; } = new List<OfferApproval>();

    public virtual Status Status { get; set; } = null!;
}
