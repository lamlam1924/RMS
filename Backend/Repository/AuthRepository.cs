using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;

namespace RMS.Repository;

public interface IAuthRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByGoogleIdAsync(string googleId);
    Task<User> CreateUserAsync(User user);
    Task<RefreshToken> CreateRefreshTokenAsync(RefreshToken refreshToken);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task RevokeRefreshTokenAsync(int tokenId);
    Task<List<string>> GetUserRolesAsync(int userId);
    Task<List<string>> GetUserDepartmentsAsync(int userId);
}

public class AuthRepository : IAuthRepository
{
    private readonly RecruitmentDbContext _context;

    public AuthRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .Where(u => u.Email == email && u.IsActive == true && u.IsDeleted != true)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> GetUserByGoogleIdAsync(string googleId)
    {
        return await _context.Users
            .Where(u => u.GoogleId == googleId && u.IsActive == true && u.IsDeleted != true)
            .FirstOrDefaultAsync();
    }

    public async Task<User> CreateUserAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<RefreshToken> CreateRefreshTokenAsync(RefreshToken refreshToken)
    {
        await _context.RefreshTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();
        return refreshToken;
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .Where(rt => rt.Token == token && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();
    }

    public async Task RevokeRefreshTokenAsync(int tokenId)
    {
        var token = await _context.RefreshTokens.FindAsync(tokenId);
        if (token != null)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<string>> GetUserRolesAsync(int userId)
    {
        // Assuming you have UserRole table, adjust as needed
        // For now, return empty list or default role
        return new List<string> { "User" };
    }

    public async Task<List<string>> GetUserDepartmentsAsync(int userId)
    {
        var departments = await _context.UserDepartments
            .Where(ud => ud.UserId == userId)
            .Include(ud => ud.Department)
            .Select(ud => ud.Department.Name)
            .ToListAsync();

        return departments;
    }
}
