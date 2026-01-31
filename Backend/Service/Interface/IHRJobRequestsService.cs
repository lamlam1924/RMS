using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRJobRequestsService
{
    Task<List<JobRequestListDto>> GetJobRequestsAsync();
    Task<List<JobRequestListDto>> GetPendingJobRequestsAsync();
    Task<JobRequestDetailDto?> GetJobRequestByIdAsync(int id);
}
