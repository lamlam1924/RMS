using System;

namespace RMS.Entity;

public partial class OfferEditHistory
{
    public int Id { get; set; }
    public int OfferId { get; set; }
    public int EditedBy { get; set; }
    public DateTime EditedAt { get; set; }

    public decimal? Salary { get; set; }
    public string? Benefits { get; set; }
    public DateOnly? StartDate { get; set; }

    public virtual Offer Offer { get; set; } = null!;
    public virtual User EditedByNavigation { get; set; } = null!;
}
