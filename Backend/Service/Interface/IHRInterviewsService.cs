using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Quản lý phỏng vấn từ phía HR: tạo, cập nhật, chốt kết quả, huỷ và nộp feedback
/// </summary>
public interface IHRInterviewsService
{
    /// <summary>Lấy toàn bộ danh sách phỏng vấn. scopeByStaffId != null: chỉ interview thuộc job Staff được gán.</summary>
    Task<List<InterviewListDto>> GetInterviewsAsync(int? scopeByStaffId = null);

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra. scopeByStaffId != null: chỉ job Staff được gán.</summary>
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync(int? scopeByStaffId = null);

    /// <summary>Lấy chi tiết một buổi phỏng vấn. scopeByStaffId != null: null nếu không thuộc job Staff.</summary>
    Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int? scopeByStaffId = null);

    /// <summary>Tạo buổi phỏng vấn mới. scopeByStaffId != null: chỉ được tạo cho application thuộc job Staff được gán.</summary>
    Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId, int? scopeByStaffId = null);

    /// <summary>Cập nhật thông tin buổi phỏng vấn. scopeByStaffId != null: chỉ được sửa interview thuộc job Staff.</summary>
    Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto, int? scopeByStaffId = null);

    /// <summary>Chốt kết quả phỏng vấn: PASS → hồ sơ qua vòng, REJECT → loại (chỉ HR Manager)</summary>
    Task<ActionResponseDto> FinalizeInterviewAsync(int interviewId, FinalizeInterviewDto dto, int userId);

    /// <summary>Huỷ buổi phỏng vấn. scopeByStaffId != null: chỉ được hủy interview thuộc job Staff.</summary>
    Task<ActionResponseDto> CancelInterviewAsync(int interviewId, int userId, int? scopeByStaffId = null);

    /// <summary>Kiểm tra application có thuộc job được gán cho staff (để scope GetRoundProgress, v.v.).</summary>
    Task<bool> IsApplicationInStaffScopeAsync(int applicationId, int staffId);

    /// <summary>HR nộp feedback khi tham gia phỏng vấn với tư cách interviewer</summary>
    Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, SubmitInterviewFeedbackDto dto, int userId);

    /// <summary>Sau khi chọn online/offline: gửi thông báo chỉ cho người phỏng vấn. Ứng viên nhận riêng khi HR gửi yêu cầu xác nhận.</summary>
    Task<ActionResponseDto> SendInvitationAsync(int interviewId, SendInvitationDto? dto, int? scopeByStaffId = null);

    /// <summary>Gửi thông báo theo block (chỉ người phỏng vấn).</summary>
    Task<ActionResponseDto> SendInvitationBatchAsync(SendInvitationBatchDto dto, int? scopeByStaffId = null);

    /// <summary>Gửi yêu cầu xác nhận tham gia cho ứng viên (sau khi interviewer xác nhận). Ứng viên mới thấy buổi trong "Phỏng vấn của tôi". Khi gửi lại sau đổi lịch: nếu ứng viên đã từ chối thì chuyển sang RESCHEDULED để ứng viên xác nhận lại.</summary>
    Task<ActionResponseDto> SendCandidateConfirmationRequestAsync(int interviewId, int userId, int? scopeByStaffId = null);

    /// <summary>Gửi hàng loạt yêu cầu xác nhận tham gia cho ứng viên.</summary>
    Task<ActionResponseDto> SendCandidateConfirmationRequestBatchAsync(SendInvitationBatchDto dto, int userId, int? scopeByStaffId = null);

    /// <summary>Danh sách phỏng vấn có ghi chú từ chối (ứng viên hoặc interviewer) cần HR xử lý.</summary>
    Task<List<InterviewNeedingAttentionDto>> GetInterviewsNeedingAttentionAsync(int? scopeByStaffId = null);

    /// <summary>Lịch sử thay đổi / sự kiện của buổi phỏng vấn (timeline cho HR).</summary>
    Task<List<InterviewHistoryItemDto>> GetInterviewHistoryAsync(int interviewId, int? scopeByStaffId = null);

    /// <summary>Sau khi đổi lịch: xóa participant cũ, gửi yêu cầu đề cử đến trưởng phòng ban cho ngày mới (các buổi khác cùng ngày giữ nguyên interviewer).</summary>
    Task<ActionResponseDto> RequestParticipantsAfterRescheduleAsync(int interviewId, int userId, int? scopeByStaffId = null);
}
