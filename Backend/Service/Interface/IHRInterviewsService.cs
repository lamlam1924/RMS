using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRInterviewsService
{
    Task<List<InterviewListDto>> GetInterviewsAsync();
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync();
    Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId);
    Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId);
    Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto);
    Task<ActionResponseDto> FinalizeInterviewAsync(int interviewId, FinalizeInterviewDto dto, int userId);
    Task<ActionResponseDto> CancelInterviewAsync(int interviewId, int userId);
}
