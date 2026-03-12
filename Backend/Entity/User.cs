using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public string? AvatarUrl { get; set; }

    public string? PasswordHash { get; set; }

    public string? GoogleId { get; set; }

    public string AuthProvider { get; set; } = null!;

    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();

    public virtual ICollection<InterviewFeedback> InterviewFeedbacks { get; set; } = new List<InterviewFeedback>();

    public virtual ICollection<InterviewParticipant> InterviewParticipants { get; set; } = new List<InterviewParticipant>();

    public virtual ICollection<Interview> Interviews { get; set; } = new List<Interview>();

    public virtual ICollection<JobPosting> JobPostingAssignedStaffs { get; set; } = new List<JobPosting>();

    public virtual ICollection<JobPosting> JobPostingCreatedByNavigations { get; set; } = new List<JobPosting>();

    public virtual ICollection<JobRequest> JobRequestAssignedStaffs { get; set; } = new List<JobRequest>();

    public virtual ICollection<JobRequest> JobRequestRequestedByNavigations { get; set; } = new List<JobRequest>();

    public virtual ICollection<OfferApproval> OfferApprovals { get; set; } = new List<OfferApproval>();

    public virtual ICollection<ParticipantRequest> ParticipantRequestAssignedToUsers { get; set; } = new List<ParticipantRequest>();

    public virtual ICollection<ParticipantRequest> ParticipantRequestForwardedToUsers { get; set; } = new List<ParticipantRequest>();

    public virtual ICollection<ParticipantRequest> ParticipantRequestRequestedByUsers { get; set; } = new List<ParticipantRequest>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();

    public virtual ICollection<UserDepartment> UserDepartments { get; set; } = new List<UserDepartment>();

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
}
