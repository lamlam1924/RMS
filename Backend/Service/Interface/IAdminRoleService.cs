using RMS.Dto.Admin;

namespace RMS.Service.Interface;

public interface IAdminRoleService
{
    Task<List<RoleListResponseDto>> GetAllRolesAsync();
    Task<RoleDetailResponseDto?> GetRoleByIdAsync(int id);
    Task<RoleDetailResponseDto> CreateRoleAsync(CreateRoleRequestDto dto);
    Task<RoleDetailResponseDto> UpdateRoleAsync(int id, UpdateRoleRequestDto dto);
    Task<bool> DeleteRoleAsync(int id);
    Task<List<PermissionDto>> GetPermissionsAsync();
}
