using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Interview
{
    public int Id { get; set; }

    public int ApplicationId { get; set; }

    public int RoundNo { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public string? Location { get; set; }

    public string? MeetingLink { get; set; }

    public int StatusId { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public int RescheduledCount { get; set; }

    public DateTime? RequiresFeedbackBy { get; set; }

    public bool FeedbackReminderSent { get; set; }

    public bool IsNextRoundScheduled { get; set; }

    public DateTime? CandidateInvitationSentAt { get; set; }

    public string? CandidateDeclineNote { get; set; }

    public virtual Application Application { get; set; } = null!;

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<InterviewFeedback> InterviewFeedbacks { get; set; } = new List<InterviewFeedback>();

    public virtual ICollection<InterviewParticipant> InterviewParticipants { get; set; } = new List<InterviewParticipant>();

    public virtual InterviewRoundDecision? InterviewRoundDecision { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual ICollection<ParticipantRequest> Requests { get; set; } = new List<ParticipantRequest>();
}
