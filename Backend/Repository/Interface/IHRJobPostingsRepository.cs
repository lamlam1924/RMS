using RMS.Dto.HR;
using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRJobPostingsRepository
{
    Task<List<JobPostingListDto>> GetJobPostingsAsync(int? statusId = null);
    Task<List<JobPostingListDto>> GetDraftJobPostingsAsync();
    Task<JobPosting> GetJobPostingByIdAsync(int id);
    Task<int> CreateJobPostingAsync(JobPosting jobPosting);
    Task<bool> UpdateJobPostingAsync(JobPosting jobPosting);
    Task<bool> PublishJobPostingAsync(int jobPostingId, int userId);
    Task<bool> CloseJobPostingAsync(int jobPostingId, string reason, int userId);
}
