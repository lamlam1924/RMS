using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRApplicationsService
{
    Task<List<ApplicationListDto>> GetApplicationsAsync(int? statusId = null);
    Task<ApplicationDetailDto?> GetApplicationByIdAsync(int id);
    Task<ActionResponseDto> UpdateApplicationStatusAsync(UpdateApplicationStatusDto dto, int userId);
}
