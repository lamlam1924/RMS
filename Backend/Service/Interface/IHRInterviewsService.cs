using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Quản lý phỏng vấn từ phía HR: tạo, cập nhật, chốt kết quả, huỷ và nộp feedback
/// </summary>
public interface IHRInterviewsService
{
    /// <summary>Lấy toàn bộ danh sách phỏng vấn</summary>
    Task<List<InterviewListDto>> GetInterviewsAsync();

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra</summary>
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync();

    /// <summary>Lấy chi tiết một buổi phỏng vấn</summary>
    Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId);

    /// <summary>Tạo buổi phỏng vấn mới, tự tính vòng và gửi email thông báo</summary>
    Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId);

    /// <summary>Cập nhật thông tin buổi phỏng vấn (thời gian, địa điểm, link)</summary>
    Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto);

    /// <summary>Chốt kết quả phỏng vấn: PASS → hồ sơ qua vòng, REJECT → loại</summary>
    Task<ActionResponseDto> FinalizeInterviewAsync(int interviewId, FinalizeInterviewDto dto, int userId);

    /// <summary>Huỷ buổi phỏng vấn</summary>
    Task<ActionResponseDto> CancelInterviewAsync(int interviewId, int userId);

    /// <summary>HR nộp feedback khi tham gia phỏng vấn với tư cách interviewer</summary>
    Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, SubmitInterviewFeedbackDto dto, int userId);
}
