namespace RMS.Dto.Common;

/// <summary>
/// Interview participant DTO - shared across Employee and DepartmentManager modules
/// </summary>
public class InterviewParticipantDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string InterviewRole { get; set; } = string.Empty;
    public bool HasFeedback { get; set; }
}
