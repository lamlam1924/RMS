using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Kiểm tra xung đột lịch phỏng vấn giữa các interviewer và candidate
/// </summary>
public interface IInterviewConflictService
{
    /// <summary>Kiểm tra xung đột lịch của danh sách interviewer tại khung giờ chỉ định</summary>
    Task<List<InterviewConflictDto>> CheckInterviewerConflictsAsync(
        List<int> interviewerIds,
        DateTime startTime,
        DateTime endTime,
        int? excludeInterviewId = null);

    /// <summary>Kiểm tra xung đột lịch của candidate tại khung giờ chỉ định</summary>
    Task<InterviewConflictDto?> CheckCandidateConflictAsync(
        int candidateId,
        DateTime startTime,
        DateTime endTime,
        int? excludeInterviewId = null);

    /// <summary>Kiểm tra toàn bộ xung đột (interviewer + candidate)</summary>
    Task<ConflictCheckResultDto> CheckAllConflictsAsync(
        int applicationId,
        List<int> interviewerIds,
        DateTime startTime,
        DateTime endTime,
        int? excludeInterviewId = null);

    /// <summary>Tìm các khung giờ trống cho danh sách interviewer trong khoảng ngày chỉ định</summary>
    Task<List<TimeSlotDto>> FindAvailableTimeSlotsAsync(
        List<int> interviewerIds,
        DateTime dateFrom,
        DateTime dateTo,
        int durationMinutes);
}
