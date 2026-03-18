using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using RMS.Common;
using RMS.Dto.Auth;
using RMS.Entity;
using RMS.Repository;
using RMS.Service.Interface;

namespace RMS.Service;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IMemoryCache _cache;
    private readonly IEmailService _emailService;
    private readonly JwtTokenHelper _jwtTokenHelper;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AuthService> _logger;
    private readonly ICloudinaryService _cloudinaryService;

    public AuthService(
        IAuthRepository authRepository,
        IMemoryCache cache,
        IEmailService emailService,
        JwtTokenHelper jwtTokenHelper,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<AuthService> logger,
        ICloudinaryService cloudinaryService)
    {
        _authRepository = authRepository;
        _cache = cache;
        _emailService = emailService;
        _jwtTokenHelper = jwtTokenHelper;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _cloudinaryService = cloudinaryService;
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _authRepository.EmailExistsAsync(email);
    }

    public async Task<OtpResponseDto> SendOtpAsync(string email)
    {
        // 1. Check if email already exists
        if (await _authRepository.EmailExistsAsync(email))
        {
            return new OtpResponseDto
            {
                Success = false,
                Message = "Email đã được sử dụng"
            };
        }

        // 2. Generate 6-digit OTP
        var random = new Random();
        var otpCode = random.Next(100000, 999999).ToString();
        var expiresAt = DateTimeHelper.Now.AddMinutes(5);

        // 3. Store OTP in cache with 5 minutes expiration
        var cacheKey = $"otp_{email}";
        var otpData = new OtpCacheData
        {
            Code = otpCode,
            ExpiresAt = expiresAt,
            Attempts = 0
        };
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
        
        _cache.Set(cacheKey, otpData, cacheOptions);

        // 4. Send OTP email
        try
        {
            await _emailService.SendOtpEmailAsync(email, otpCode);
            _logger.LogInformation("OTP sent successfully to {Email}", email);

            return new OtpResponseDto
            {
                Success = true,
                Message = "Mã OTP đã được gửi đến email của bạn",
                ExpiresAt = expiresAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP to {Email}", email);
            _cache.Remove(cacheKey); // Clean up on failure
            return new OtpResponseDto
            {
                Success = false,
                Message = "Không thể gửi email. Vui lòng thử lại sau."
            };
        }
    }

    public Task<OtpResponseDto> VerifyOtpAsync(string email, string otpCode)
    {
        var cacheKey = $"otp_{email}";
        
        if (!_cache.TryGetValue<OtpCacheData>(cacheKey, out var otpData) || otpData == null)
        {
            return Task.FromResult(new OtpResponseDto
            {
                Success = false,
                Message = "Mã OTP không hợp lệ hoặc đã hết hạn"
            });
        }

        // Check attempts
        if (otpData.Attempts >= 5)
        {
            _cache.Remove(cacheKey);
            return Task.FromResult(new OtpResponseDto
            {
                Success = false,
                Message = "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới"
            });
        }

        // Verify OTP
        if (otpData.Code == otpCode)
        {
            // Mark as verified by storing a flag
            var verifiedKey = $"otp_verified_{email}";
            _cache.Set(verifiedKey, true, TimeSpan.FromMinutes(10)); // Valid for 10 minutes
            _cache.Remove(cacheKey); // Remove OTP after verification
            
            _logger.LogInformation("OTP verified successfully for {Email}", email);
            return Task.FromResult(new OtpResponseDto
            {
                Success = true,
                Message = "Xác thực email thành công"
            });
        }

        // Increment attempts
        var updatedData = new OtpCacheData
        {
            Code = otpData.Code,
            ExpiresAt = otpData.ExpiresAt,
            Attempts = otpData.Attempts + 1
        };
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(updatedData.ExpiresAt);
        _cache.Set(cacheKey, updatedData, cacheOptions);

        return Task.FromResult(new OtpResponseDto
        {
            Success = false,
            Message = "Mã OTP không đúng"
        });
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // 1. Check if email is verified
        var verifiedKey = $"otp_verified_{request.Email}";
        if (!_cache.TryGetValue(verifiedKey, out bool _))
        {
            throw new InvalidOperationException("Email chưa được xác thực. Vui lòng xác thực email trước.");
        }

        // 2. Check if email already exists in Candidates or Users
        if (await _authRepository.CandidateEmailExistsAsync(request.Email) || 
            await _authRepository.EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email đã được sử dụng");
        }

        // 3. Hash password
        var passwordHash = PasswordHelper.HashPassword(request.Password);

        // 4. Create new CANDIDATE (Default for public registration)
        var newCandidate = new Candidate
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = passwordHash,
            AuthProvider = "LOCAL",
            CreatedAt = DateTimeHelper.Now,
            IsDeleted = false
        };

        var candidate = await _authRepository.CreateCandidateAsync(newCandidate);
        _logger.LogInformation("New candidate registered: {Email}", candidate.Email);

        // 5. Remove verification flag
        _cache.Remove(verifiedKey);

        // 6. Generate access token only (No refresh token for candidates yet)
        var accessToken = _jwtTokenHelper.GenerateAccessToken(candidate);

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = null, // Disable refresh token for candidates
            User = new UserInfoDto
            {
                Id = candidate.Id,
                FullName = candidate.FullName,
                Email = candidate.Email,
                AvatarUrl = candidate.AvatarUrl,
                AuthProvider = candidate.AuthProvider,
                Roles = new List<string> { "CANDIDATE" }, // Hardcode role
                Departments = new List<string>()
            }
        };
    }

    public async Task<OtpResponseDto> SendForgotPasswordOtpAsync(string email)
    {
        // Check if email exists in either Users or Candidates
        bool existsInUsers = await _authRepository.EmailExistsAsync(email);
        bool existsInCandidates = await _authRepository.CandidateEmailExistsAsync(email);

        if (!existsInUsers && !existsInCandidates)
        {
            return new OtpResponseDto
            {
                Success = false,
                Message = "Email không tồn tại trong hệ thống"
            };
        }

        // Generate 6-digit OTP
        var otpCode = new Random().Next(100000, 999999).ToString();
        var expiresAt = DateTimeHelper.Now.AddMinutes(5);

        // Store in cache with key: forgot_password_otp_{email}
        var cacheKey = $"forgot_password_otp_{email}";
        var otpData = new OtpCacheData
        {
            Code = otpCode,
            ExpiresAt = expiresAt,
            Attempts = 0
        };

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(expiresAt);
        _cache.Set(cacheKey, otpData, cacheOptions);

        // Send OTP email
        await _emailService.SendOtpEmailAsync(email, otpCode);
        
        _logger.LogInformation("Forgot password OTP sent to {Email}", email);

        return new OtpResponseDto
        {
            Success = true,
            Message = "Mã OTP đã được gửi đến email của bạn",
            ExpiresAt = expiresAt
        };
    }

    public Task<OtpResponseDto> VerifyForgotPasswordOtpAsync(string email, string otpCode)
    {
        var cacheKey = $"forgot_password_otp_{email}";
        
        if (!_cache.TryGetValue<OtpCacheData>(cacheKey, out var otpData) || otpData == null)
        {
            return Task.FromResult(new OtpResponseDto
            {
                Success = false,
                Message = "Mã OTP không hợp lệ hoặc đã hết hạn"
            });
        }

        // Check attempts
        if (otpData.Attempts >= 5)
        {
            _cache.Remove(cacheKey);
            return Task.FromResult(new OtpResponseDto
            {
                Success = false,
                Message = "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới"
            });
        }

        // Verify OTP
        if (otpData.Code == otpCode)
        {
            // Mark as verified by storing a flag
            var verifiedKey = $"forgot_password_verified_{email}";
            _cache.Set(verifiedKey, true, TimeSpan.FromMinutes(10)); // Valid for 10 minutes
            _cache.Remove(cacheKey); // Remove OTP after verification
            
            _logger.LogInformation("Forgot password OTP verified for {Email}", email);
            return Task.FromResult(new OtpResponseDto
            {
                Success = true,
                Message = "Xác thực email thành công"
            });
        }

        // Increment attempts
        var updatedData = new OtpCacheData
        {
            Code = otpData.Code,
            ExpiresAt = otpData.ExpiresAt,
            Attempts = otpData.Attempts + 1
        };
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(updatedData.ExpiresAt);
        _cache.Set(cacheKey, updatedData, cacheOptions);

        return Task.FromResult(new OtpResponseDto
        {
            Success = false,
            Message = "Mã OTP không đúng"
        });
    }

    public async Task<bool> ResetPasswordAsync(string email, string newPassword)
    {
        // Check if OTP was verified
        var verifiedKey = $"forgot_password_verified_{email}";
        if (!_cache.TryGetValue(verifiedKey, out bool _))
        {
            throw new InvalidOperationException("Email chưa được xác thực. Vui lòng xác thực email trước.");
        }

        // Get user
        var user = await _authRepository.GetUserByEmailAsync(email);
        if (user != null)
        {
            // Update user password
            user.PasswordHash = PasswordHelper.HashPassword(newPassword);
            user.UpdatedAt = DateTimeHelper.Now;
            await _authRepository.UpdateUserAsync(user);
        }
        else
        {
            // Try to get candidate
            var candidate = await _authRepository.GetCandidateByEmailAsync(email);
            if (candidate != null)
            {
                // Update candidate password
                candidate.PasswordHash = PasswordHelper.HashPassword(newPassword);
                // candidate.UpdatedAt = DateTimeHelper.Now; // Assuming Candidate has UpdatedAt, need to check entity first
                await _authRepository.UpdateCandidateAsync(candidate);
            }
            else
            {
                throw new InvalidOperationException("Không tìm thấy người dùng");
            }
        }
        
        // Remove verification flag
        _cache.Remove(verifiedKey);
        
        _logger.LogInformation("Password reset successful for {Email}", email);
        return true;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        // 1. Find user by email (Staff Login)
        var user = await _authRepository.GetUserByEmailAsync(request.Email);
        
        if (user != null)
        {
            // Login as Staff Logic (Old Logic)
            if (string.IsNullOrEmpty(user.PasswordHash)) throw new UnauthorizedAccessException("Email hoặc password không đúng");
            if (!PasswordHelper.VerifyPassword(request.Password, user.PasswordHash)) throw new UnauthorizedAccessException("Email hoặc password không đúng");
            if (user.IsActive != true) throw new UnauthorizedAccessException("Tài khoản đã bị vô hiệu hóa");

            var roles = await _authRepository.GetUserRolesAsync(user.Id);
            var departments = await _authRepository.GetUserDepartmentsAsync(user.Id);
            var accessToken = _jwtTokenHelper.GenerateAccessToken(user, roles);
            
            // Generate Refresh Token logic for Staff...
            string? refreshToken = null;
            if (request.RememberMe)
            {
                refreshToken = _jwtTokenHelper.GenerateRefreshToken();
                var expirationDays = int.Parse(_configuration["JWT:RefreshTokenExpirationDays"]!);
                await _authRepository.CreateRefreshTokenAsync(new RefreshToken
                {
                    UserId = user.Id, Token = refreshToken,
                    ExpiresAt = DateTimeHelper.Now.AddDays(expirationDays), CreatedAt = DateTimeHelper.Now, IsRevoked = false
                });
            }

            return new LoginResponseDto
            {
                AccessToken = accessToken, RefreshToken = refreshToken,
                User = new UserInfoDto { Id = user.Id, FullName = user.FullName, Email = user.Email, AvatarUrl = user.AvatarUrl, AuthProvider = user.AuthProvider, Roles = roles, Departments = departments }
            };
        }

        // 2. If Staff not found, Try Login as Candidate
        var candidate = await _authRepository.GetCandidateByEmailAsync(request.Email);
        if (candidate != null)
        {
            if (string.IsNullOrEmpty(candidate.PasswordHash) || !PasswordHelper.VerifyPassword(request.Password, candidate.PasswordHash))
            {
                 throw new UnauthorizedAccessException("Email hoặc password không đúng");
            }

            var accessToken = _jwtTokenHelper.GenerateAccessToken(candidate);
            
            return new LoginResponseDto
            {
                AccessToken = accessToken, RefreshToken = null,
                User = new UserInfoDto { Id = candidate.Id, FullName = candidate.FullName, Email = candidate.Email, AvatarUrl = candidate.AvatarUrl, AuthProvider = candidate.AuthProvider, Roles = new List<string> { "CANDIDATE" }, Departments = new List<string>() }
            };
        }

        throw new UnauthorizedAccessException("Email hoặc password không đúng");
    }

    public async Task<LoginResponseDto> LoginWithGoogleAsync(string code)
    {
        var tokenResponse = await ExchangeCodeForTokenAsync(code);
        var googleUser = await GetGoogleUserInfoAsync(tokenResponse.AccessToken);
        
        // 1. Check if User (Staff) exists
        var user = await _authRepository.GetUserByGoogleIdAsync(googleUser.Sub) ?? await _authRepository.GetUserByEmailAsync(googleUser.Email);

        if (user != null)
        {
            if (string.IsNullOrEmpty(user.GoogleId)) // Update GoogleID if missing
            {
                user.GoogleId = googleUser.Sub;
                user.AuthProvider = "Google";
                await _authRepository.UpdateUserAsync(user);
            }
            
            var roles = await _authRepository.GetUserRolesAsync(user.Id);
            var departments = await _authRepository.GetUserDepartmentsAsync(user.Id);
            var accessToken = _jwtTokenHelper.GenerateAccessToken(user, roles);
            var refreshToken = _jwtTokenHelper.GenerateRefreshToken();
            var expirationDays = int.Parse(_configuration["JWT:RefreshTokenExpirationDays"]!);
            
            await _authRepository.CreateRefreshTokenAsync(new RefreshToken { UserId = user.Id, Token = refreshToken, ExpiresAt = DateTimeHelper.Now.AddDays(expirationDays), CreatedAt = DateTimeHelper.Now, IsRevoked = false });

            return new LoginResponseDto { AccessToken = accessToken, RefreshToken = refreshToken, User = new UserInfoDto { Id = user.Id, FullName = user.FullName, Email = user.Email, AvatarUrl = user.AvatarUrl, AuthProvider = user.AuthProvider, Roles = roles, Departments = departments } };
        }

        // 2. Check if Candidate exists
        var candidate = await _authRepository.GetCandidateByGoogleIdAsync(googleUser.Sub) ?? await _authRepository.GetCandidateByEmailAsync(googleUser.Email);
        
        if (candidate == null)
        {
            // Create New Candidate
            candidate = new Candidate
            {
                FullName = googleUser.Name, Email = googleUser.Email, GoogleId = googleUser.Sub,
                AuthProvider = "Google", CreatedAt = DateTimeHelper.Now, IsDeleted = false
            };
            await _authRepository.CreateCandidateAsync(candidate);
        }
        else if (string.IsNullOrEmpty(candidate.GoogleId))
        {
             candidate.GoogleId = googleUser.Sub;
             candidate.AuthProvider = "Google";
             await _authRepository.UpdateCandidateAsync(candidate);
        }

        var candidateToken = _jwtTokenHelper.GenerateAccessToken(candidate);
        return new LoginResponseDto
        {
            AccessToken = candidateToken, RefreshToken = null,
            User = new UserInfoDto { Id = candidate.Id, FullName = candidate.FullName, Email = candidate.Email, AvatarUrl = candidate.AvatarUrl, AuthProvider = candidate.AuthProvider, Roles = new List<string> { "CANDIDATE" }, Departments = new List<string>() }
        };
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
    {
        // 1. Validate refresh token
        var tokenEntity = await _authRepository.GetRefreshTokenAsync(refreshToken);
        if (tokenEntity == null)
        {
            throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        // 2. Get user and roles
        var user = tokenEntity.User;
        var roles = await _authRepository.GetUserRolesAsync(user.Id);
        var departments = await _authRepository.GetUserDepartmentsAsync(user.Id);

        // 3. Generate new access token
        var accessToken = _jwtTokenHelper.GenerateAccessToken(user, roles);

        // 4. Optionally: Generate new refresh token and revoke old one
        var newRefreshToken = _jwtTokenHelper.GenerateRefreshToken();
        var expirationDays = int.Parse(_configuration["JWT:RefreshTokenExpirationDays"]!);

        await _authRepository.RevokeRefreshTokenAsync(tokenEntity.Id);
        await _authRepository.CreateRefreshTokenAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTimeHelper.Now.AddDays(expirationDays),
            CreatedAt = DateTimeHelper.Now,
            IsRevoked = false
        });

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            User = new UserInfoDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                AuthProvider = user.AuthProvider,
                Roles = roles,
                Departments = departments
            }
        };
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var tokenEntity = await _authRepository.GetRefreshTokenAsync(refreshToken);
        if (tokenEntity != null)
        {
            await _authRepository.RevokeRefreshTokenAsync(tokenEntity.Id);
        }
    }

    public async Task ChangePasswordAsync(string userId, bool isCandidate, string currentPassword, string newPassword)
    {
        if (isCandidate)
        {
            var candidate = await _authRepository.GetCandidateByIdAsync(int.Parse(userId));
            if (candidate == null)
                throw new InvalidOperationException("Không tìm thấy tài khoản");

            // Google OAuth candidates may not have a password
            if (string.IsNullOrEmpty(candidate.PasswordHash))
                throw new InvalidOperationException("Tài khoản đăng nhập bằng Google không thể đổi mật khẩu theo cách này");

            if (!PasswordHelper.VerifyPassword(currentPassword, candidate.PasswordHash))
                throw new InvalidOperationException("Mật khẩu hiện tại không đúng");

            candidate.PasswordHash = PasswordHelper.HashPassword(newPassword);
            await _authRepository.UpdateCandidateAsync(candidate);
        }
        else
        {
            var user = await _authRepository.GetUserByIdAsync(int.Parse(userId));
            if (user == null)
                throw new InvalidOperationException("Không tìm thấy tài khoản");

            if (string.IsNullOrEmpty(user.PasswordHash))
                throw new InvalidOperationException("Tài khoản đăng nhập bằng Google không thể đổi mật khẩu theo cách này");

            if (!PasswordHelper.VerifyPassword(currentPassword, user.PasswordHash))
                throw new InvalidOperationException("Mật khẩu hiện tại không đúng");

            user.PasswordHash = PasswordHelper.HashPassword(newPassword);
            user.UpdatedAt = DateTimeHelper.Now;
            await _authRepository.UpdateUserAsync(user);
        }

        _logger.LogInformation("Password changed successfully for userId: {UserId}", userId);
    }

    public async Task<string> UploadAvatarAsync(string userId, bool isCandidate, Stream fileStream, string fileName)
    {
        var result = await _cloudinaryService.UploadAsync(fileStream, fileName, "avatars");
        var avatarUrl = result.SecureUrl;

        if (isCandidate)
        {
            var candidate = await _authRepository.GetCandidateByIdAsync(int.Parse(userId));
            if (candidate == null) throw new InvalidOperationException("Không tìm thấy tài khoản");
            
            candidate.AvatarUrl = avatarUrl;
            await _authRepository.UpdateCandidateAsync(candidate);
        }
        else
        {
            var user = await _authRepository.GetUserByIdAsync(int.Parse(userId));
            if (user == null) throw new InvalidOperationException("Không tìm thấy tài khoản");
            
            user.AvatarUrl = avatarUrl;
            user.UpdatedAt = DateTimeHelper.Now;
            await _authRepository.UpdateUserAsync(user);
        }
        
        return avatarUrl;
    }

    // Private helper methods for Google OAuth
    private async Task<GoogleTokenResponse> ExchangeCodeForTokenAsync(string code)
    {
        var client = _httpClientFactory.CreateClient();
        var redirectUri = _configuration["Google:RedirectUri"]!;
        
        _logger.LogInformation("Exchanging code with redirect_uri: {RedirectUri}", redirectUri);
        
        var requestData = new Dictionary<string, string>
        {
            { "code", code },
            { "client_id", _configuration["Google:ClientId"]! },
            { "client_secret", _configuration["Google:ClientSecret"]! },
            { "redirect_uri", redirectUri },
            { "grant_type", "authorization_code" }
        };

        var response = await client.PostAsync(
            "https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(requestData)
        );

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to exchange code for token. Status: {Status}, Error: {Error}", 
                response.StatusCode, errorContent);
            throw new Exception($"Failed to exchange code for token: {errorContent}");
        }

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<GoogleTokenResponse>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })!;
    }

    private async Task<GoogleUserInfo> GetGoogleUserInfoAsync(string accessToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
        
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception("Failed to get user info from Google");
        }

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<GoogleUserInfo>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })!;
    }
}

// Helper class for Google token response
internal class GoogleTokenResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = null!;
    
    [System.Text.Json.Serialization.JsonPropertyName("token_type")]
    public string TokenType { get; set; } = null!;
    
    [System.Text.Json.Serialization.JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }
}
