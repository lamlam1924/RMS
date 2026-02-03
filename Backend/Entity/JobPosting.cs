using System;

namespace RMS.Entity;

public partial class JobPosting
{
    public int Id { get; set; }

    public int JobRequestId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? Requirements { get; set; }

    public string? Benefits { get; set; }

    public decimal? SalaryMin { get; set; }

    public decimal? SalaryMax { get; set; }

    public string? Location { get; set; }

    public DateOnly? DeadlineDate { get; set; }

    public int StatusId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public virtual JobRequest JobRequest { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }
}
