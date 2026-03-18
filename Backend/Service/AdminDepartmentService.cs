using RMS.Dto.Admin;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class AdminDepartmentService : IAdminDepartmentService
{
    private readonly IAdminDepartmentRepository _repository;

    public AdminDepartmentService(IAdminDepartmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<DepartmentListResponseDto>> GetAllDepartmentsAsync()
    {
        return await _repository.GetAllDepartmentsAsync();
    }

    public async Task<DepartmentDetailResponseDto?> GetDepartmentByIdAsync(int id)
    {
        return await _repository.GetDepartmentByIdAsync(id);
    }

    public async Task<DepartmentDetailResponseDto> CreateDepartmentAsync(CreateDepartmentRequestDto dto, int createdBy)
    {
        var deptId = await _repository.CreateDepartmentAsync(dto, createdBy);

        var department = await _repository.GetDepartmentByIdAsync(deptId);
        if (department == null)
        {
            throw new InvalidOperationException("Failed to create department");
        }

        return department;
    }

    public async Task<DepartmentDetailResponseDto> UpdateDepartmentAsync(int id, UpdateDepartmentRequestDto dto)
    {
        var success = await _repository.UpdateDepartmentAsync(id, dto);
        if (!success)
        {
            throw new InvalidOperationException("Department not found");
        }

        var department = await _repository.GetDepartmentByIdAsync(id);
        if (department == null)
        {
            throw new InvalidOperationException("Department not found");
        }

        return department;
    }

    public async Task<bool> DeleteDepartmentAsync(int id, int deletedBy)
    {
        return await _repository.DeleteDepartmentAsync(id, deletedBy);
    }

    public async Task<bool> UpdateDepartmentStatusAsync(int id, bool isActive)
    {
        return await _repository.UpdateDepartmentStatusAsync(id, isActive);
    }
}
