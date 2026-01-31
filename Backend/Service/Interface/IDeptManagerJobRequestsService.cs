using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;

namespace RMS.Service.Interface;

public interface IDeptManagerJobRequestsService
{
    Task<List<DeptManagerJobRequestListDto>> GetJobRequestsAsync(int managerId);
    Task<DeptManagerJobRequestDetailDto?> GetJobRequestDetailAsync(int id, int managerId);
    Task<ActionResponseDto> CreateJobRequestAsync(CreateJobRequestDto request, int managerId);
    Task<ActionResponseDto> UpdateJobRequestAsync(int id, UpdateJobRequestDto request, int managerId);
    Task<ActionResponseDto> SubmitJobRequestAsync(int id, int managerId);
    Task<ActionResponseDto> DeleteJobRequestAsync(int id, int managerId);
    Task<List<ApplicationSummaryDto>> GetApplicationsByJobRequestAsync(int jobRequestId, int managerId);
}
