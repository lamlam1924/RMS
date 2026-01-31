using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IDeptManagerJobRequestsRepository
{
    Task<List<JobRequest>> GetJobRequestsByManagerIdAsync(int managerId);
    Task<JobRequest?> GetJobRequestByIdAsync(int id, int managerId);
    Task<JobRequest> CreateJobRequestAsync(JobRequest jobRequest);
    Task<bool> UpdateJobRequestAsync(JobRequest jobRequest);
    Task<bool> DeleteJobRequestAsync(int id, int managerId);
    Task<bool> SubmitJobRequestAsync(int id, int managerId);
    Task<List<StatusHistory>> GetJobRequestStatusHistoryAsync(int jobRequestId);
    Task<List<Application>> GetApplicationsByJobRequestIdAsync(int jobRequestId, int managerId);
    Task<bool> ValidatePositionAccessAsync(int positionId, int managerId);
}
