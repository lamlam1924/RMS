namespace RMS.Service.Interface;

/// <summary>
/// Xử lý việc nộp feedback của interviewer sau buổi phỏng vấn
/// </summary>
public interface IInterviewFeedbackSubmissionService
{
    /// <summary>Lưu feedback (quyết định + ghi chú) của interviewer cho một buổi phỏng vấn</summary>
    Task SubmitAsync(
        int interviewId,
        int interviewerId,
        string decision,
        string? comment);
}
