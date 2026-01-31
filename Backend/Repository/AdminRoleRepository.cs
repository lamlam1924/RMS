using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Admin;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class AdminRoleRepository : IAdminRoleRepository
{
    private readonly RecruitmentDbContext _context;

    public AdminRoleRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<RoleListResponseDto>> GetAllRolesAsync()
    {
        return await _context.Roles
            .Select(r => new RoleListResponseDto
            {
                RoleId = r.Id,
                RoleName = r.Name,
                Code = r.Code,
                Description = null, // Add Description field to Role entity if needed
                IsSystemRole = r.ParentRoleId == null, // System roles have no parent
                UserCount = r.Users.Count,
                CreatedAt = null // Add CreatedAt field to Role entity if needed
            })
            .ToListAsync();
    }

    public async Task<RoleDetailResponseDto?> GetRoleByIdAsync(int id)
    {
        return await _context.Roles
            .Where(r => r.Id == id)
            .Select(r => new RoleDetailResponseDto
            {
                RoleId = r.Id,
                RoleName = r.Name,
                Code = r.Code,
                Description = null,
                IsSystemRole = r.ParentRoleId == null,
                Permissions = new List<string>(), // Implement permissions if needed
                UserCount = r.Users.Count,
                CreatedAt = null
            })
            .FirstOrDefaultAsync();
    }

    public async Task<int> CreateRoleAsync(CreateRoleRequestDto dto)
    {
        var role = new Entity.Role
        {
            Name = dto.RoleName,
            Code = dto.Code,
            ParentRoleId = null
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        return role.Id;
    }

    public async Task<bool> UpdateRoleAsync(int id, UpdateRoleRequestDto dto)
    {
        var role = await _context.Roles.FindAsync(id);
        if (role == null) return false;

        role.Name = dto.RoleName;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteRoleAsync(int id)
    {
        var role = await _context.Roles
            .Include(r => r.Users)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role == null) return false;

        // Don't delete if role has users
        if (role.Users.Any())
        {
            throw new InvalidOperationException("Cannot delete role with assigned users");
        }

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RoleCodeExistsAsync(string code, int? excludeRoleId = null)
    {
        var query = _context.Roles.Where(r => r.Code == code);
        
        if (excludeRoleId.HasValue)
        {
            query = query.Where(r => r.Id != excludeRoleId.Value);
        }

        return await query.AnyAsync();
    }
}
