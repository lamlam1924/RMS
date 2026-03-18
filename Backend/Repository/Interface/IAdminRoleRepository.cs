using RMS.Dto.Admin;

namespace RMS.Repository.Interface;

public interface IAdminRoleRepository
{
    Task<List<RoleListResponseDto>> GetAllRolesAsync();
    Task<RoleDetailResponseDto?> GetRoleByIdAsync(int id);
    Task<int> CreateRoleAsync(CreateRoleRequestDto dto);
    Task<bool> UpdateRoleAsync(int id, UpdateRoleRequestDto dto);
    Task<bool> DeleteRoleAsync(int id);
    Task<bool> RoleCodeExistsAsync(string code, int? excludeRoleId = null);
}
