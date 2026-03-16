using RMS.Dto.HR;
using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRInterviewsRepository
{
    /// <summary>Lấy toàn bộ danh sách phỏng vấn. scopeByStaffId != null: chỉ job được gán cho Staff đó.</summary>
    Task<List<InterviewListDto>> GetInterviewsAsync(int? scopeByStaffId = null);

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra. scopeByStaffId != null: chỉ job được gán cho Staff đó.</summary>
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync(int? scopeByStaffId = null);

    /// <summary>Lấy chi tiết một buổi phỏng vấn. scopeByStaffId != null: trả về null nếu không thuộc job của Staff.</summary>
    Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int? scopeByStaffId = null);

    /// <summary>Kiểm tra interview có thuộc phạm vi job của staff (JobRequest.AssignedStaffId == staffId).</summary>
    Task<bool> IsInterviewInStaffScopeAsync(int interviewId, int staffId);

    /// <summary>Lấy AssignedStaffId của JobRequest chứa application (null nếu không có).</summary>
    Task<int?> GetApplicationAssignedStaffIdAsync(int applicationId);

    /// <summary>Tạo buổi phỏng vấn, tự tính RoundNo, kiểm tra xung đột lịch candidate</summary>
    Task<(int interviewId, string? conflictWarning)> CreateInterviewAsync(CreateInterviewDto dto, int userId);

    /// <summary>Cập nhật thông tin buổi phỏng vấn</summary>
    Task<bool> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto);

    /// <summary>Chốt kết quả: PASS → Application PASSED, REJECT → Application REJECTED</summary>
    Task<bool> FinalizeInterviewAsync(int interviewId, string decision, string? note, int userId);

    /// <summary>Huỷ buổi phỏng vấn</summary>
    Task<bool> CancelInterviewAsync(int interviewId, int userId);

    /// <summary>Lấy tiêu chí đánh giá theo vị trí và vòng phỏng vấn</summary>
    Task<List<EvaluationCriterion>> GetCriteriaByPositionAsync(int positionId, int roundNo);

    /// <summary>Kiểm tra user có được phân công vào buổi phỏng vấn không</summary>
    Task<bool> IsInterviewParticipantAsync(int interviewId, int userId);

    /// <summary>Kiểm tra user đã nộp feedback cho buổi phỏng vấn chưa</summary>
    Task<bool> HasFeedbackAsync(int interviewId, int userId);

    /// <summary>Đánh dấu đã gửi yêu cầu xác nhận tham gia cho ứng viên (để ứng viên thấy trong "Phỏng vấn của tôi")</summary>
    Task SetCandidateInvitationSentAtAsync(int interviewId, DateTime sentAt);

    /// <summary>Khi gửi lại yêu cầu xác nhận cho ứng viên (sau đổi lịch): nếu đang DECLINED_BY_CANDIDATE thì chuyển sang RESCHEDULED, xóa ghi chú, set CandidateInvitationSentAt và ghi lịch sử.</summary>
    Task PrepareResendCandidateInvitationAsync(int interviewId, DateTime sentAt, int changedByUserId);

    /// <summary>Lịch sử thay đổi trạng thái / sự kiện của buổi phỏng vấn (HR xem timeline).</summary>
    Task<List<InterviewHistoryItemDto>> GetInterviewHistoryAsync(int interviewId);

    /// <summary>Xóa toàn bộ participant của buổi phỏng vấn (dùng khi đổi lịch, cần trưởng phòng đề cử lại).</summary>
    Task RemoveAllParticipantsAsync(int interviewId);

    /// <summary>Trưởng phòng ban của phòng chứa vị trí tuyển dụng (JobRequest.Position.Department.HeadUserId). Null nếu không có.</summary>
    Task<int?> GetDeptManagerUserIdByInterviewIdAsync(int interviewId);

    /// <summary>Danh sách phỏng vấn có ghi chú từ chối (ứng viên hoặc interviewer) cần HR xử lý. scopeByStaffId: chỉ job được gán cho Staff.</summary>
    Task<List<InterviewNeedingAttentionDto>> GetInterviewsNeedingAttentionAsync(int? scopeByStaffId = null);
}
