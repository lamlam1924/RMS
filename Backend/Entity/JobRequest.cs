using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class JobRequest
{
    public int Id { get; set; }

    public int PositionId { get; set; }

    public int RequestedBy { get; set; }

    public int Quantity { get; set; }

    public int StatusId { get; set; }

    public int Priority { get; set; }

    public decimal? Budget { get; set; }

    public string? Reason { get; set; }

    public DateOnly? ExpectedStartDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public DateTime? LastReturnedAt { get; set; }

    public DateTime? LastViewedByManagerAt { get; set; }

    public int? AssignedStaffId { get; set; }

    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();

    public virtual User? AssignedStaff { get; set; }

    public virtual ICollection<JobPosting> JobPostings { get; set; } = new List<JobPosting>();

    public virtual ICollection<Offer> Offers { get; set; } = new List<Offer>();

    public virtual ICollection<RecruitmentReport> RecruitmentReports { get; set; } = new List<RecruitmentReport>();

    public virtual Position Position { get; set; } = null!;

    public virtual User RequestedByNavigation { get; set; } = null!;
}
