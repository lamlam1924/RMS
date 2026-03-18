using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Admin;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class AdminDepartmentRepository : IAdminDepartmentRepository
{
    private readonly RecruitmentDbContext _context;

    public AdminDepartmentRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<DepartmentListResponseDto>> GetAllDepartmentsAsync()
    {
        return await _context.Departments
            .Where(d => d.IsDeleted != true)
            .Select(d => new DepartmentListResponseDto
            {
                DepartmentId = d.Id,
                DepartmentName = d.Name,
                Description = null, // Add Description field to Department entity if needed
                ManagerId = d.HeadUserId,
                ManagerName = d.HeadUser != null ? d.HeadUser.FullName : null,
                IsActive = true, // Add IsActive field to Department entity if needed
                EmployeeCount = d.UserDepartments.Count,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<DepartmentDetailResponseDto?> GetDepartmentByIdAsync(int id)
    {
        return await _context.Departments
            .Where(d => d.Id == id && d.IsDeleted != true)
            .Select(d => new DepartmentDetailResponseDto
            {
                DepartmentId = d.Id,
                DepartmentName = d.Name,
                Description = null,
                ManagerId = d.HeadUserId,
                ManagerName = d.HeadUser != null ? d.HeadUser.FullName : null,
                IsActive = true,
                EmployeeCount = d.UserDepartments.Count,
                CreatedAt = d.CreatedAt,
                UpdatedAt = null // Add UpdatedAt field to Department entity if needed
            })
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateDepartmentAsync(CreateDepartmentRequestDto dto, int createdBy)
    {
        var department = new Entity.Department
        {
            Name = dto.DepartmentName,
            HeadUserId = dto.ManagerId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return department.Id;
    }

    public async Task<bool> UpdateDepartmentAsync(int id, UpdateDepartmentRequestDto dto)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.IsDeleted != true);

        if (department == null) return false;

        department.Name = dto.DepartmentName;
        department.HeadUserId = dto.ManagerId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteDepartmentAsync(int id, int deletedBy)
    {
        var department = await _context.Departments.FindAsync(id);
        if (department == null || department.IsDeleted == true) return false;

        department.IsDeleted = true;
        department.DeletedAt = DateTime.UtcNow;
        department.DeletedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateDepartmentStatusAsync(int id, bool isActive)
    {
        // Since IsActive doesn't exist in Department entity, we can use IsDeleted as inverse
        var department = await _context.Departments.FindAsync(id);
        if (department == null) return false;

        // For now, just update nothing since we don't have IsActive field
        // You can add this field to Department entity later

        await _context.SaveChangesAsync();
        return true;
    }
}
