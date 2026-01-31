using RMS.Common;
using RMS.Dto.Admin;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class AdminUserService : IAdminUserService
{
    private readonly IAdminUserRepository _repository;

    public AdminUserService(IAdminUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<UserListResponseDto>> GetAllUsersAsync()
    {
        return await _repository.GetAllUsersAsync();
    }

    public async Task<UserDetailResponseDto?> GetUserByIdAsync(int id)
    {
        return await _repository.GetUserByIdAsync(id);
    }

    public async Task<UserDetailResponseDto> CreateUserAsync(CreateUserRequestDto dto, int createdBy)
    {
        // Validate email
        if (await _repository.EmailExistsAsync(dto.Email))
        {
            throw new InvalidOperationException("Email already exists");
        }

        // Hash password
        var passwordHash = PasswordHelper.HashPassword(dto.Password);

        // Create user
        var userId = await _repository.CreateUserAsync(dto, passwordHash, createdBy);

        // Get created user
        var user = await _repository.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("Failed to create user");
        }

        return user;
    }

    public async Task<UserDetailResponseDto> UpdateUserAsync(int id, UpdateUserRequestDto dto, int updatedBy)
    {
        var success = await _repository.UpdateUserAsync(id, dto, updatedBy);
        if (!success)
        {
            throw new InvalidOperationException("User not found");
        }

        var user = await _repository.GetUserByIdAsync(id);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        return user;
    }

    public async Task<bool> DeleteUserAsync(int id, int deletedBy)
    {
        return await _repository.DeleteUserAsync(id, deletedBy);
    }

    public async Task<bool> UpdateUserStatusAsync(int id, bool isActive, int updatedBy)
    {
        return await _repository.UpdateUserStatusAsync(id, isActive, updatedBy);
    }

    public async Task<ResetPasswordResponseDto> ResetPasswordAsync(int id, int updatedBy)
    {
        // Generate random password
        var newPassword = GenerateRandomPassword();
        var passwordHash = PasswordHelper.HashPassword(newPassword);

        var success = await _repository.UpdateUserPasswordAsync(id, passwordHash, updatedBy);
        if (!success)
        {
            throw new InvalidOperationException("User not found");
        }

        return new ResetPasswordResponseDto
        {
            NewPassword = newPassword,
            Message = "Password has been reset successfully"
        };
    }

    private string GenerateRandomPassword()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 12)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
