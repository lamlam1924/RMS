using RMS.Dto.Common;
using RMS.Dto.Employee;

namespace RMS.Service.Interface;

/// <summary>
/// Phỏng vấn dành cho nhân viên (employee) — xem lịch, xác nhận tham gia, nộp feedback khi được phân công
/// </summary>
public interface IEmployeeInterviewsService
{
    Task<List<EmployeeInterviewListDto>> GetInterviewsAsync(int userId);
    Task<List<EmployeeInterviewListDto>> GetUpcomingInterviewsAsync(int userId);
    Task<EmployeeInterviewDetailDto?> GetInterviewDetailAsync(int id, int userId);
    Task<ActionResponseDto> RespondToParticipationAsync(int interviewId, int userId, string response, string? note = null);
    Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, SubmitInterviewFeedbackDto feedback, int userId);
}
