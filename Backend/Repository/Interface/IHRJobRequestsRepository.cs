using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRJobRequestsRepository
{
    Task<List<JobRequest>> GetJobRequestsAsync();
    Task<List<JobRequest>> GetPendingJobRequestsAsync();
    Task<JobRequest?> GetJobRequestByIdAsync(int id);
    Task<List<StatusHistory>> GetStatusHistoryAsync(int entityId, string entityTypeCode);
}
