using RMS.Dto.HR;
using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRJobPostingsRepository
{
    Task<List<JobPostingListDto>> GetJobPostingsAsync(int? statusId = null);
    Task<List<JobPostingListDto>> GetDraftJobPostingsAsync();
    Task<List<JobPostingListDto>> GetJobPostingsByStaffAsync(int staffId);
    Task<JobPosting> GetJobPostingByIdAsync(int id);
    Task<string?> GetJdFileUrlAsync(int jobRequestId);
    Task<int> GetApplicationCountAsync(int jobRequestId);
    Task<bool> HasJobPostingByJobRequestIdAsync(int jobRequestId, int? excludeJobPostingId = null);
    Task<JobRequest?> GetJobRequestByIdAsync(int jobRequestId);
    Task<int> CreateJobPostingAsync(JobPosting jobPosting);
    Task<bool> UpdateJobPostingAsync(JobPosting jobPosting);
    Task<bool> PublishJobPostingAsync(int jobPostingId, int userId);
    Task<bool> CloseJobPostingAsync(int jobPostingId, string reason, int userId);
    Task<bool> AssignStaffAsync(int jobPostingId, int staffId, int managerId);
    Task<List<HRStaffDto>> GetHRStaffListAsync();
}
