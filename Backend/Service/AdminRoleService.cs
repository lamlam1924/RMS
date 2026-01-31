using RMS.Dto.Admin;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class AdminRoleService : IAdminRoleService
{
    private readonly IAdminRoleRepository _repository;

    public AdminRoleService(IAdminRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<RoleListResponseDto>> GetAllRolesAsync()
    {
        return await _repository.GetAllRolesAsync();
    }

    public async Task<RoleDetailResponseDto?> GetRoleByIdAsync(int id)
    {
        return await _repository.GetRoleByIdAsync(id);
    }

    public async Task<RoleDetailResponseDto> CreateRoleAsync(CreateRoleRequestDto dto)
    {
        // Validate role code
        if (await _repository.RoleCodeExistsAsync(dto.Code))
        {
            throw new InvalidOperationException("Role code already exists");
        }

        var roleId = await _repository.CreateRoleAsync(dto);

        var role = await _repository.GetRoleByIdAsync(roleId);
        if (role == null)
        {
            throw new InvalidOperationException("Failed to create role");
        }

        return role;
    }

    public async Task<RoleDetailResponseDto> UpdateRoleAsync(int id, UpdateRoleRequestDto dto)
    {
        var success = await _repository.UpdateRoleAsync(id, dto);
        if (!success)
        {
            throw new InvalidOperationException("Role not found");
        }

        var role = await _repository.GetRoleByIdAsync(id);
        if (role == null)
        {
            throw new InvalidOperationException("Role not found");
        }

        return role;
    }

    public async Task<bool> DeleteRoleAsync(int id)
    {
        return await _repository.DeleteRoleAsync(id);
    }

    public Task<List<PermissionDto>> GetPermissionsAsync()
    {
        // Define available permissions
        var permissions = new List<PermissionDto>
        {
            new() { Id = "user.view", Name = "View Users", Description = "View user list and details" },
            new() { Id = "user.create", Name = "Create Users", Description = "Create new users" },
            new() { Id = "user.edit", Name = "Edit Users", Description = "Edit user information" },
            new() { Id = "user.delete", Name = "Delete Users", Description = "Delete users" },
            new() { Id = "role.view", Name = "View Roles", Description = "View role list and details" },
            new() { Id = "role.create", Name = "Create Roles", Description = "Create new roles" },
            new() { Id = "role.edit", Name = "Edit Roles", Description = "Edit role information" },
            new() { Id = "role.delete", Name = "Delete Roles", Description = "Delete roles" },
            new() { Id = "department.view", Name = "View Departments", Description = "View department list and details" },
            new() { Id = "department.create", Name = "Create Departments", Description = "Create new departments" },
            new() { Id = "department.edit", Name = "Edit Departments", Description = "Edit department information" },
            new() { Id = "department.delete", Name = "Delete Departments", Description = "Delete departments" },
            new() { Id = "config.view", Name = "View Configuration", Description = "View system configuration" },
            new() { Id = "config.edit", Name = "Edit Configuration", Description = "Edit system configuration" },
            new() { Id = "candidate.view", Name = "View Candidates", Description = "View candidate list and details" },
            new() { Id = "candidate.manage", Name = "Manage Candidates", Description = "Manage candidate applications" },
            new() { Id = "interview.view", Name = "View Interviews", Description = "View interview list and details" },
            new() { Id = "interview.manage", Name = "Manage Interviews", Description = "Schedule and manage interviews" },
            new() { Id = "job.view", Name = "View Jobs", Description = "View job postings" },
            new() { Id = "job.create", Name = "Create Jobs", Description = "Create new job postings" },
            new() { Id = "job.edit", Name = "Edit Jobs", Description = "Edit job postings" },
            new() { Id = "job.delete", Name = "Delete Jobs", Description = "Delete job postings" }
        };

        return Task.FromResult(permissions);
    }
}
