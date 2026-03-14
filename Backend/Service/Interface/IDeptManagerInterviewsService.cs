using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;

namespace RMS.Service.Interface;

/// <summary>
/// Xem và tham gia phỏng vấn với tư cách interviewer (dùng chung cho mọi role được phân công)
/// </summary>
public interface IDeptManagerInterviewsService
{
    /// <summary>Lấy danh sách phỏng vấn mà user được phân công tham gia</summary>
    Task<List<DeptManagerInterviewListDto>> GetInterviewsAsync(int managerId);

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra của user</summary>
    Task<List<DeptManagerInterviewListDto>> GetUpcomingInterviewsAsync(int managerId);

    /// <summary>Lấy chi tiết buổi phỏng vấn (chỉ khi user được phân công)</summary>
    Task<DeptManagerInterviewDetailDto?> GetInterviewDetailAsync(int id, int managerId);

    /// <summary>Nộp feedback sau khi tham gia phỏng vấn</summary>
    Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, SubmitInterviewFeedbackDto feedback, int managerId);
}
