using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Quản lý luồng phỏng vấn nhiều vòng: kiểm tra điều kiện, lên lịch vòng tiếp theo, nhắc nhở feedback
/// </summary>
public interface IInterviewMultiRoundService
{
    /// <summary>Kiểm tra xem phỏng vấn có đủ điều kiện để lên lịch vòng tiếp theo không</summary>
    Task<NextRoundCheckResultDto> CheckNextRoundEligibilityAsync(int interviewId);

    /// <summary>Lấy tiến trình các vòng phỏng vấn của một hồ sơ ứng tuyển</summary>
    Task<InterviewRoundProgressDto> GetRoundProgressAsync(int applicationId);

    /// <summary>Lấy danh sách feedback chưa nộp (có thể lọc theo interviewer hoặc quá hạn)</summary>
    Task<List<PendingFeedbackDto>> GetPendingFeedbacksAsync(int? interviewerId = null, bool overdueOnly = false);

    /// <summary>Gửi email nhắc nhở nộp feedback cho interviewer của buổi phỏng vấn</summary>
    Task<bool> SendFeedbackReminderAsync(int interviewId);

    /// <summary>HR xem xét và ghi nhận quyết định cho một vòng phỏng vấn đã hoàn thành</summary>
    Task<InterviewRoundDecisionDto> ReviewRoundAsync(int interviewId, ReviewInterviewRoundRequestDto request, int decidedBy);

    /// <summary>Tự động lên lịch vòng phỏng vấn tiếp theo dựa trên kết quả vòng trước</summary>
    Task<int> AutoScheduleNextRoundAsync(int previousInterviewId, ScheduleNextRoundRequestDto request, int createdBy);

    /// <summary>
    /// Tự động lên lịch vòng phỏng vấn tiếp theo theo lô cho nhiều hồ sơ (cùng vị trí),
    /// sử dụng cùng một khung giờ bắt đầu + độ dài + khoảng nghỉ giữa các buổi.
    /// </summary>
    Task<List<int>> AutoScheduleNextRoundBatchAsync(NextRoundBatchScheduleRequestDto request, int createdBy);
}
