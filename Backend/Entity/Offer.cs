using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Offer
{
    public int Id { get; set; }

    public int? ApplicationId { get; set; }

    public decimal? ProposedSalary { get; set; }

    public int StatusId { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public string? Benefits { get; set; }

    public DateOnly? StartDate { get; set; }

    public string? CandidateResponse { get; set; }

    public DateTime? CandidateRespondedAt { get; set; }

    public string? CandidateComment { get; set; }

    public DateTime? SentAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public int? CandidateId { get; set; }

    public int? JobRequestId { get; set; }

    public virtual Application? Application { get; set; }

    public virtual Candidate? Candidate { get; set; }

    public virtual JobRequest? JobRequest { get; set; }

    public virtual ICollection<OfferApproval> OfferApprovals { get; set; } = new List<OfferApproval>();

    public virtual Status Status { get; set; } = null!;
}
