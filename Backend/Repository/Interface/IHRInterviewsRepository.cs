using RMS.Dto.HR;

namespace RMS.Repository.Interface;

public interface IHRInterviewsRepository
{
    Task<List<InterviewListDto>> GetInterviewsAsync();
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync();
    Task<int> CreateInterviewAsync(int applicationId, DateTime scheduledAt, string? location, int userId);
    Task<bool> UpdateInterviewAsync(int interviewId, DateTime? scheduledAt, string? location, int userId);
}
