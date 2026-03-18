using RMS.Dto.Admin;

namespace RMS.Service.Interface;

public interface IAdminUserService
{
    Task<List<UserListResponseDto>> GetAllUsersAsync();
    Task<UserDetailResponseDto?> GetUserByIdAsync(int id);
    Task<UserDetailResponseDto> CreateUserAsync(CreateUserRequestDto dto, int createdBy);
    Task<UserDetailResponseDto> UpdateUserAsync(int id, UpdateUserRequestDto dto, int updatedBy);
    Task<bool> DeleteUserAsync(int id, int deletedBy);
    Task<bool> UpdateUserStatusAsync(int id, bool isActive, int updatedBy);
    Task<ResetPasswordResponseDto> ResetPasswordAsync(int id, int updatedBy);
}
