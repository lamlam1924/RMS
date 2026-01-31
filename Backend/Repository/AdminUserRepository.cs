using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Admin;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class AdminUserRepository : IAdminUserRepository
{
    private readonly RecruitmentDbContext _context;

    public AdminUserRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserListResponseDto>> GetAllUsersAsync()
    {
        return await _context.Users
            .Where(u => u.IsDeleted != true)
            .Select(u => new UserListResponseDto
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = null, // Add PhoneNumber field to User entity if needed
                IsActive = u.IsActive ?? false,
                RoleId = u.Roles.FirstOrDefault() != null ? u.Roles.FirstOrDefault()!.Id : null,
                RoleName = u.Roles.FirstOrDefault() != null ? u.Roles.FirstOrDefault()!.Name : null,
                DepartmentId = u.UserDepartments.FirstOrDefault() != null ? u.UserDepartments.FirstOrDefault()!.DepartmentId : null,
                DepartmentName = u.UserDepartments.FirstOrDefault() != null ? u.UserDepartments.FirstOrDefault()!.Department.Name : null,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<UserDetailResponseDto?> GetUserByIdAsync(int id)
    {
        return await _context.Users
            .Where(u => u.Id == id && u.IsDeleted != true)
            .Select(u => new UserDetailResponseDto
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = null,
                IsActive = u.IsActive ?? false,
                RoleId = u.Roles.FirstOrDefault() != null ? u.Roles.FirstOrDefault()!.Id : null,
                RoleName = u.Roles.FirstOrDefault() != null ? u.Roles.FirstOrDefault()!.Name : null,
                DepartmentId = u.UserDepartments.FirstOrDefault() != null ? u.UserDepartments.FirstOrDefault()!.DepartmentId : null,
                DepartmentName = u.UserDepartments.FirstOrDefault() != null ? u.UserDepartments.FirstOrDefault()!.Department.Name : null,
                AuthProvider = u.AuthProvider,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                CreatedBy = u.CreatedBy,
                UpdatedBy = u.UpdatedBy
            })
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateUserAsync(CreateUserRequestDto dto, string passwordHash, int createdBy)
    {
        var user = new Entity.User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = passwordHash,
            AuthProvider = "local",
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            IsDeleted = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign role
        if (dto.RoleId > 0)
        {
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role != null)
            {
                user.Roles.Add(role);
            }
        }

        // Assign department
        if (dto.DepartmentId.HasValue && dto.DepartmentId > 0)
        {
            var userDepartment = new Entity.UserDepartment
            {
                UserId = user.Id,
                DepartmentId = dto.DepartmentId.Value
            };
            _context.UserDepartments.Add(userDepartment);
        }

        await _context.SaveChangesAsync();
        return user.Id;
    }

    public async Task<bool> UpdateUserAsync(int id, UpdateUserRequestDto dto, int updatedBy)
    {
        var user = await _context.Users
            .Include(u => u.Roles)
            .Include(u => u.UserDepartments)
            .FirstOrDefaultAsync(u => u.Id == id && u.IsDeleted != true);

        if (user == null) return false;

        user.FullName = dto.FullName;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

        // Update role
        user.Roles.Clear();
        if (dto.RoleId > 0)
        {
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role != null)
            {
                user.Roles.Add(role);
            }
        }

        // Update department
        var existingDept = user.UserDepartments.FirstOrDefault();
        if (dto.DepartmentId.HasValue && dto.DepartmentId > 0)
        {
            if (existingDept != null)
            {
                existingDept.DepartmentId = dto.DepartmentId.Value;
            }
            else
            {
                _context.UserDepartments.Add(new Entity.UserDepartment
                {
                    UserId = user.Id,
                    DepartmentId = dto.DepartmentId.Value
                });
            }
        }
        else if (existingDept != null)
        {
            _context.UserDepartments.Remove(existingDept);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteUserAsync(int id, int deletedBy)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || user.IsDeleted == true) return false;

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        user.DeletedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateUserStatusAsync(int id, bool isActive, int updatedBy)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || user.IsDeleted == true) return false;

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateUserPasswordAsync(int id, string passwordHash, int updatedBy)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || user.IsDeleted == true) return false;

        user.PasswordHash = passwordHash;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EmailExistsAsync(string email, int? excludeUserId = null)
    {
        var query = _context.Users.Where(u => u.Email == email && u.IsDeleted != true);
        
        if (excludeUserId.HasValue)
        {
            query = query.Where(u => u.Id != excludeUserId.Value);
        }

        return await query.AnyAsync();
    }
}
