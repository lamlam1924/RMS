using RMS.Dto.Admin;

namespace RMS.Service.Interface;

public interface IAdminDepartmentService
{
    Task<List<DepartmentListResponseDto>> GetAllDepartmentsAsync();
    Task<DepartmentDetailResponseDto?> GetDepartmentByIdAsync(int id);
    Task<DepartmentDetailResponseDto> CreateDepartmentAsync(CreateDepartmentRequestDto dto, int createdBy);
    Task<DepartmentDetailResponseDto> UpdateDepartmentAsync(int id, UpdateDepartmentRequestDto dto);
    Task<bool> DeleteDepartmentAsync(int id, int deletedBy);
    Task<bool> UpdateDepartmentStatusAsync(int id, bool isActive);
}
