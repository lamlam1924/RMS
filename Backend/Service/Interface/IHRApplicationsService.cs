using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRApplicationsService
{
    /// <param name="scopeByStaffId">Khi có giá trị: chỉ application thuộc job được gán cho staff.</param>
    Task<List<ApplicationListDto>> GetApplicationsAsync(int? statusId = null, int? scopeByStaffId = null);
    Task<ApplicationDetailDto?> GetApplicationByIdAsync(int id);
    Task<ApplicationCvSnapshotDto?> GetApplicationCvSnapshotAsync(int id);
    Task<ActionResponseDto> UpdateApplicationStatusAsync(UpdateApplicationStatusDto dto, int userId);
}
