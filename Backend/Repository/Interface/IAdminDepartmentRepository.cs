using RMS.Dto.Admin;

namespace RMS.Repository.Interface;

public interface IAdminDepartmentRepository
{
    Task<List<DepartmentListResponseDto>> GetAllDepartmentsAsync();
    Task<DepartmentDetailResponseDto?> GetDepartmentByIdAsync(int id);
    Task<int> CreateDepartmentAsync(CreateDepartmentRequestDto dto, int createdBy);
    Task<bool> UpdateDepartmentAsync(int id, UpdateDepartmentRequestDto dto);
    Task<bool> DeleteDepartmentAsync(int id, int deletedBy);
    Task<bool> UpdateDepartmentStatusAsync(int id, bool isActive);
}
