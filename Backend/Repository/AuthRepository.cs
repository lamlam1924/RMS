using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;

namespace RMS.Repository;


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

    public async Task<User?> GetUserByIdAsync(int id)
    {
        return await _context.Users
            .Where(u => u.Id == id && u.IsActive == true && u.IsDeleted != true)
            .FirstOrDefaultAsync();
    }

    public async Task<User?> GetUserByGoogleIdAsync(string googleId)
    {
        return await _context.Users
            .Where(u => u.GoogleId == googleId && u.IsActive == true && u.IsDeleted != true)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users
            .AnyAsync(u => u.Email == email && u.IsDeleted != true);
    }

    public async Task<User> CreateUserAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateUserAsync(User user)
    {
        _context.Users.Update(user);
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
        var user = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);
            
        if (user == null) return new List<string>();
        
        return user.Roles.Select(r => r.Code).ToList();
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

    public async Task<Candidate?> GetCandidateByEmailAsync(string email)
    {
        return await _context.Candidates
            .Where(c => c.Email == email && c.IsDeleted != true)
            .FirstOrDefaultAsync();
    }

    public async Task<Candidate?> GetCandidateByIdAsync(int id)
    {
        return await _context.Candidates
            .Where(c => c.Id == id && c.IsDeleted != true)
            .FirstOrDefaultAsync();
    }

    public async Task<Candidate?> GetCandidateByGoogleIdAsync(string googleId)
    {
        return await _context.Candidates
            .Where(c => c.GoogleId == googleId && c.IsDeleted != true)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> CandidateEmailExistsAsync(string email)
    {
        return await _context.Candidates
            .AnyAsync(c => c.Email == email && c.IsDeleted != true);
    }

    public async Task<Candidate> CreateCandidateAsync(Candidate candidate)
    {
        await _context.Candidates.AddAsync(candidate);
        await _context.SaveChangesAsync();
        return candidate;
    }

    public async Task<Candidate> UpdateCandidateAsync(Candidate candidate)
    {
        _context.Candidates.Update(candidate);
        await _context.SaveChangesAsync();
        return candidate;
    }
}
