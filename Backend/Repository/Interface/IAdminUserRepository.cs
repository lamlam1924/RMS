using RMS.Dto.Admin;

namespace RMS.Repository.Interface;

public interface IAdminUserRepository
{
    Task<List<UserListResponseDto>> GetAllUsersAsync();
    Task<UserDetailResponseDto?> GetUserByIdAsync(int id);
    Task<int> CreateUserAsync(CreateUserRequestDto dto, string passwordHash, int createdBy);
    Task<bool> UpdateUserAsync(int id, UpdateUserRequestDto dto, int updatedBy);
    Task<bool> DeleteUserAsync(int id, int deletedBy);
    Task<bool> EmailExistsAsync(string email, int? excludeUserId = null);
    Task<bool> UpdateUserStatusAsync(int id, bool isActive, int updatedBy);
    Task<bool> UpdateUserPasswordAsync(int id, string passwordHash, int updatedBy);
}
