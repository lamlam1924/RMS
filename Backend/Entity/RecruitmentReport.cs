using System;

namespace RMS.Entity;

public partial class RecruitmentReport
{
    public int Id { get; set; }

    public int JobId { get; set; }

    public int TotalApply { get; set; }

    public int TotalOffer { get; set; }

    public int TotalRejectOffer { get; set; }

    public int TotalHired { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual JobRequest Job { get; set; } = null!;
}
