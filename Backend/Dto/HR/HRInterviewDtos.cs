namespace RMS.Dto.HR;

public class InterviewListDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int RoundNo { get; set; }
    public string CandidateName { get; set; } = "";
    public string? CandidateEmail { get; set; }
    public string PositionTitle { get; set; } = "";
    public int PositionId { get; set; }
    public string DepartmentName { get; set; } = "";
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; } = "";
    public string? MeetingLink { get; set; }
    public string StatusCode { get; set; } = "";
    public string StatusName { get; set; } = "";
    public int ParticipantCount { get; set; }
    public int FeedbackCount { get; set; }
    public int OpenParticipantRequestCount { get; set; }
    public int FulfilledParticipantRequestCount { get; set; }
    /// <summary>Có ghi chú từ chối (ứng viên hoặc interviewer) cần HR/Trưởng phòng xử lý.</summary>
    public bool HasDeclineNote { get; set; }
}

/// <summary>Một mục trong lịch sử thay đổi buổi phỏng vấn (HR xem timeline).</summary>
public class InterviewHistoryItemDto
{
    public DateTime? At { get; set; }
    public string? FromStatusName { get; set; }
    public string? ToStatusName { get; set; }
    public string? Note { get; set; }
    public string? ChangedByName { get; set; }
}

/// <summary>Một buổi phỏng vấn cần xử lý từ chối (hiển thị trên PhaseOverview / danh sách).</summary>
public class InterviewNeedingAttentionDto
{
    public int InterviewId { get; set; }
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public DateTime StartTime { get; set; }
    public string StatusCode { get; set; } = "";
    public string StatusName { get; set; } = "";
    /// <summary>Ứng viên từ chối.</summary>
    public bool CandidateDeclined { get; set; }
    public string? CandidateDeclineNote { get; set; }
    /// <summary>Danh sách tên interviewer từ chối (có ghi chú).</summary>
    public List<string> DeclinedParticipantNames { get; set; } = new();
}

public class InterviewDetailDto : InterviewListDto
{
    /// <summary>Ghi chú khi ứng viên từ chối (để HR thương lượng/đổi lịch).</summary>
    public string? CandidateDeclineNote { get; set; }
    public List<InterviewParticipantItemDto> Participants { get; set; } = new();
    public List<InterviewFeedbackItemDto> Feedbacks { get; set; } = new();
    public InterviewRoundDecisionDto? RoundDecision { get; set; }
}

public class InterviewParticipantItemDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public string Email { get; set; } = "";
    public string InterviewRoleCode { get; set; } = "";
    public string InterviewRoleName { get; set; } = "";
    public bool HasSubmittedFeedback { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? DeclinedAt { get; set; }
    /// <summary>Ghi chú khi interviewer từ chối (để HR thương lượng/đổi lịch).</summary>
    public string? DeclineNote { get; set; }
}

public class InterviewFeedbackItemDto
{
    public int Id { get; set; }
    public int InterviewerId { get; set; }
    public string InterviewerName { get; set; } = "";
    public string? Recommendation { get; set; }
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
    public bool IgnoreConflicts { get; set; } = false; // HR Manager có thể override conflicts
    public string? ConflictOverrideReason { get; set; }
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

/// <summary>Body khi HR gửi thông báo cho ứng viên + người phỏng vấn. Nếu có Location/MeetingLink thì cập nhật interview trước khi gửi.</summary>
public class SendInvitationDto
{
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
}

/// <summary>Gửi thông báo theo block: cùng địa điểm/link cho nhiều buổi.</summary>
public class SendInvitationBatchDto
{
    public List<int> InterviewIds { get; set; } = new();
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
    /// <summary>First interview (single) or null (batch). Frontend dùng Interviews là nguồn chính.</summary>
    public int? InterviewId { get; set; }
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public DateTime? StartTime { get; set; }
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
    public DateTime? TimeRangeStart { get; set; }
    public DateTime? TimeRangeEnd { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? TitleLabel { get; set; }
    public List<ParticipantRequestInterviewItemDto> Interviews { get; set; } = new();
}

public class ParticipantRequestInterviewItemDto
{
    public int InterviewId { get; set; }
    public string CandidateName { get; set; } = "";
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
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

// ==================== PARTICIPANT REQUEST BATCH (block) – dùng chung ParticipantRequests + ParticipantRequestInterviews ====================

public class CreateParticipantRequestBatchDto
{
    public List<int> InterviewIds { get; set; } = new();
    public int AssignedToUserId { get; set; }
    public int RequiredCount { get; set; } = 1;
    public string? Message { get; set; }
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
    /// <summary>Trưởng phòng ban của phòng nào (chỉ có khi gọi GetAllDeptManagers/GetDirectors).</summary>
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public bool IsBusy { get; set; }
}
