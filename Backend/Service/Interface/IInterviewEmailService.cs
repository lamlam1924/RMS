namespace RMS.Service.Interface;

public interface IInterviewEmailService
{
    Task SendInterviewInvitationAsync(InterviewInvitationEmailData data);
    Task SendInterviewReminderAsync(InterviewReminderEmailData data);
    Task SendInterviewPassedAsync(InterviewResultEmailData data);
    Task SendInterviewFailedAsync(InterviewResultEmailData data);
    Task SendInterviewerAssignmentAsync(InterviewerAssignmentEmailData data);
    Task SendFeedbackReminderAsync(FeedbackReminderEmailData data);
    Task SendFeedbackSubmittedNotificationAsync(FeedbackSubmittedEmailData data);
}

public class InterviewInvitationEmailData
{
    public string CandidateEmail { get; set; } = "";
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public int RoundNo { get; set; }
    public string RoundName { get; set; } = "";
    public DateTime InterviewDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public string InterviewType { get; set; } = "";
    public string? MeetingLink { get; set; }
    public string? Location { get; set; }
    public string? PreparationNotes { get; set; }
    public DateTime ConfirmDeadline { get; set; }
    public string ConfirmLink { get; set; } = "";
    public string DeclineLink { get; set; } = "";
    public string HREmail { get; set; } = "";
    public string HRPhone { get; set; } = "";
}

public class InterviewReminderEmailData
{
    public string CandidateEmail { get; set; } = "";
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public DateTime InterviewDateTime { get; set; }
    public string InterviewType { get; set; } = "";
    public string? MeetingLink { get; set; }
    public string? Location { get; set; }
    public int HoursUntilInterview { get; set; }
    public string? InterviewDetailLink { get; set; }
}

public class InterviewResultEmailData
{
    public string CandidateEmail { get; set; } = "";
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public int RoundNo { get; set; }
    public string? NextSteps { get; set; }
    public string? Feedback { get; set; }
}

public class InterviewerAssignmentEmailData
{
    public string InterviewerEmail { get; set; } = "";
    public string InterviewerName { get; set; } = "";
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public int RoundNo { get; set; }
    public DateTime InterviewDateTime { get; set; }
    public string InterviewType { get; set; } = "";
    public string? MeetingLink { get; set; }
    public string? Location { get; set; }
    public string CandidateCVLink { get; set; } = "";
    public string EvaluationCriteriaLink { get; set; } = "";
    public string? InterviewDetailLink { get; set; }
}

public class FeedbackReminderEmailData
{
    public string InterviewerEmail { get; set; } = "";
    public string InterviewerName { get; set; } = "";
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public DateTime InterviewDate { get; set; }
    public DateTime FeedbackDeadline { get; set; }
    public string SubmitFeedbackLink { get; set; } = "";
    public bool IsOverdue { get; set; }
}

public class FeedbackSubmittedEmailData
{
    public string HREmail { get; set; } = "";
    public string InterviewerName { get; set; } = "";
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public int RoundNo { get; set; }
    public string InterviewDetailLink { get; set; } = "";
    public int TotalInterviewers { get; set; }
    public int SubmittedFeedbacks { get; set; }
}
