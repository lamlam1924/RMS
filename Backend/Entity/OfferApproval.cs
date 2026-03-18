using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class OfferApproval
{
    public int Id { get; set; }

    public int OfferId { get; set; }

    public int ApproverId { get; set; }

    public string Decision { get; set; } = null!;

    public string? Comment { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public virtual User Approver { get; set; } = null!;

    public virtual Offer Offer { get; set; } = null!;
}
