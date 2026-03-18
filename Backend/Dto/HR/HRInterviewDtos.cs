namespace RMS.Dto.HR;

public class InterviewListDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int RoundNo { get; set; }
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; } = "";
    public string? MeetingLink { get; set; }
    public string StatusCode { get; set; } = "";
    public string StatusName { get; set; } = "";
    public int ParticipantCount { get; set; }
    public int FeedbackCount { get; set; }
}

public class InterviewDetailDto : InterviewListDto
{
    public List<InterviewParticipantItemDto> Participants { get; set; } = new();
    public List<InterviewFeedbackItemDto> Feedbacks { get; set; } = new();
}

public class InterviewParticipantItemDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public string Email { get; set; } = "";
    public string InterviewRoleCode { get; set; } = "";
    public string InterviewRoleName { get; set; } = "";
    public bool HasSubmittedFeedback { get; set; }
}

public class InterviewFeedbackItemDto
{
    public int Id { get; set; }
    public int InterviewerId { get; set; }
    public string InterviewerName { get; set; } = "";
    public string? Note { get; set; }
    public DateTime? CreatedAt { get; set; }
    public List<InterviewScoreItemDto> Scores { get; set; } = new();
}

public class InterviewScoreItemDto
{
    public string CriteriaName { get; set; } = "";
    public decimal Weight { get; set; }
    public decimal Score { get; set; }
}

public class CreateInterviewDto
{
    public int ApplicationId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public List<ParticipantInputDto> Participants { get; set; } = new();
}

public class ParticipantInputDto
{
    public int UserId { get; set; }
    public int InterviewRoleId { get; set; }
}

public class UpdateInterviewDto
{
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
}

public class FinalizeInterviewDto
{
    /// <summary>PASS hoặc REJECT</summary>
    public string Decision { get; set; } = "";
    public string? Note { get; set; }
}

// ==================== PARTICIPANT REQUESTS ====================

public class CreateParticipantRequestDto
{
    public int AssignedToUserId { get; set; }
    public int RequiredCount { get; set; } = 1;
    public string? Message { get; set; }
}

public class ParticipantRequestDto
{
    public int Id { get; set; }
    public int InterviewId { get; set; }
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public DateTime StartTime { get; set; }
    public int RequestedByUserId { get; set; }
    public string RequestedByName { get; set; } = "";
    public int AssignedToUserId { get; set; }
    public string AssignedToName { get; set; } = "";
    public int RequiredCount { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public int? ForwardedToUserId { get; set; }
    public string? ForwardedToName { get; set; }
}

public class ForwardRequestDto
{
    public int ToUserId { get; set; }
    public string? Message { get; set; }
}

public class NominateParticipantsDto
{
    public List<int> UserIds { get; set; } = new();
}

// ==================== HR STAFF FEEDBACK ====================

public class SubmitHRInterviewFeedbackDto
{
    public List<HRInterviewScoreDto> Scores { get; set; } = new();
    public string? Comment { get; set; }
    public required string Decision { get; set; }
}

public class HRInterviewScoreDto
{
    public int CriterionId { get; set; }
    public int Score { get; set; }
}

public class SimpleUserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
}
