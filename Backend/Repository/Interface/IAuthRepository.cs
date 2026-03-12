using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;

namespace RMS.Repository;

/// <summary>
/// Repository xử lý truy vấn database cho authentication
/// </summary>
public interface IAuthRepository
{
    // ==================== User Operations ====================
    
    /// <summary>Lấy user theo ID</summary>
    Task<User?> GetUserByIdAsync(int id);

    /// <summary>Lấy user theo email</summary>
    Task<User?> GetUserByEmailAsync(string email);
    
    /// <summary>Lấy user theo Google ID</summary>
    Task<User?> GetUserByGoogleIdAsync(string googleId);
    
    /// <summary>Kiểm tra email đã tồn tại</summary>
    Task<bool> EmailExistsAsync(string email);
    
    /// <summary>Tạo user mới</summary>
    Task<User> CreateUserAsync(User user);
    
    /// <summary>Cập nhật thông tin user</summary>
    Task<User> UpdateUserAsync(User user);
    
    // ==================== Token Operations ====================
    
    /// <summary>Tạo refresh token mới</summary>
    Task<RefreshToken> CreateRefreshTokenAsync(RefreshToken refreshToken);
    
    /// <summary>Lấy refresh token hợp lệ (chưa revoke và chưa hết hạn)</summary>
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    
    /// <summary>Thu hồi refresh token</summary>
    Task RevokeRefreshTokenAsync(int tokenId);
    
    // ==================== Authorization ====================
    
    /// <summary>Lấy danh sách roles của user</summary>
    Task<List<string>> GetUserRolesAsync(int userId);
    
    /// <summary>Lấy danh sách departments của user</summary>
    Task<List<string>> GetUserDepartmentsAsync(int userId);

    // ==================== Candidate Operations ====================
    /// <summary>Lấy candidate theo ID</summary>
    Task<Candidate?> GetCandidateByIdAsync(int id);

    /// <summary>Lấy candidate theo email</summary>
    Task<Candidate?> GetCandidateByEmailAsync(string email);

    /// <summary>Lấy candidate theo Google ID</summary>
    Task<Candidate?> GetCandidateByGoogleIdAsync(string googleId);

    /// <summary>Kiểm tra email candidate đã tồn tại</summary>
    Task<bool> CandidateEmailExistsAsync(string email);

    /// <summary>Tạo candidate mới</summary>
    Task<Candidate> CreateCandidateAsync(Candidate candidate);

    /// <summary>Cập nhật thông tin candidate</summary>
    Task<Candidate> UpdateCandidateAsync(Candidate candidate);
}