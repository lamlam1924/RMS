using RMS.Dto.HR;

namespace RMS.Repository.Interface;

public interface IHRJobPostingsRepository
{
    Task<List<JobPostingListDto>> GetJobPostingsAsync(int? statusId = null);
    Task<List<JobPostingListDto>> GetDraftJobPostingsAsync();
    Task<int> CreateJobPostingAsync(int positionId, int quantity, string reason, decimal? budget, DateTime? deadline, int userId);
    Task<bool> PublishJobPostingAsync(int jobPostingId, int userId);
    Task<bool> CloseJobPostingAsync(int jobPostingId, string reason, int userId);
}
