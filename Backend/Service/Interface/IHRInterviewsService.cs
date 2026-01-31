using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRInterviewsService
{
    Task<List<InterviewListDto>> GetInterviewsAsync();
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync();
    Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId);
    Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto, int userId);
}
