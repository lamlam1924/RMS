using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;

namespace RMS.Service.Interface;

public interface IDeptManagerInterviewsService
{
    Task<List<DeptManagerInterviewListDto>> GetInterviewsAsync(int managerId);
    Task<List<DeptManagerInterviewListDto>> GetUpcomingInterviewsAsync(int managerId);
    Task<DeptManagerInterviewDetailDto?> GetInterviewDetailAsync(int id, int managerId);
    Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, SubmitInterviewFeedbackDto feedback, int managerId);
}
