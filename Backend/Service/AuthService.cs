using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using RMS.Common;
using RMS.Dto.Auth;
using RMS.Entity;
using RMS.Repository;

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

    public AuthService(
        IAuthRepository authRepository,
        IMemoryCache cache,
        IEmailService emailService,
        JwtTokenHelper jwtTokenHelper,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<AuthService> logger)
    {
        _authRepository = authRepository;
        _cache = cache;
        _emailService = emailService;
        _jwtTokenHelper = jwtTokenHelper;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
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

    public async Task<OtpResponseDto> VerifyOtpAsync(string email, string otpCode)
    {
        var cacheKey = $"otp_{email}";
        
        if (!_cache.TryGetValue<OtpCacheData>(cacheKey, out var otpData) || otpData == null)
        {
            return new OtpResponseDto
            {
                Success = false,
                Message = "Mã OTP không hợp lệ hoặc đã hết hạn"
            };
        }

        // Check attempts
        if (otpData.Attempts >= 5)
        {
            _cache.Remove(cacheKey);
            return new OtpResponseDto
            {
                Success = false,
                Message = "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới"
            };
        }

        // Verify OTP
        if (otpData.Code == otpCode)
        {
            // Mark as verified by storing a flag
            var verifiedKey = $"otp_verified_{email}";
            _cache.Set(verifiedKey, true, TimeSpan.FromMinutes(10)); // Valid for 10 minutes
            _cache.Remove(cacheKey); // Remove OTP after verification
            
            _logger.LogInformation("OTP verified successfully for {Email}", email);
            return new OtpResponseDto
            {
                Success = true,
                Message = "Xác thực email thành công"
            };
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

        return new OtpResponseDto
        {
            Success = false,
            Message = "Mã OTP không đúng"
        };
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // 1. Check if email is verified
        var verifiedKey = $"otp_verified_{request.Email}";
        if (!_cache.TryGetValue(verifiedKey, out bool _))
        {
            throw new InvalidOperationException("Email chưa được xác thực. Vui lòng xác thực email trước.");
        }

        // 2. Check if email already exists
        if (await _authRepository.EmailExistsAsync(request.Email))
        {
            throw new InvalidOperationException("Email đã được sử dụng");
        }

        // 3. Hash password
        var passwordHash = PasswordHelper.HashPassword(request.Password);

        // 4. Create new user
        var newUser = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = passwordHash,
            AuthProvider = "Local",
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTimeHelper.Now
        };

        var user = await _authRepository.CreateUserAsync(newUser);
        _logger.LogInformation("New user registered: {Email}", user.Email);

        // 5. Remove verification flag
        _cache.Remove(verifiedKey);

        // 6. Get user roles and departments (default)
        var roles = await _authRepository.GetUserRolesAsync(user.Id);
        var departments = await _authRepository.GetUserDepartmentsAsync(user.Id);

        // 7. Generate tokens (auto login after register)
        var accessToken = _jwtTokenHelper.GenerateAccessToken(user, roles);
        var refreshToken = _jwtTokenHelper.GenerateRefreshToken();
        var expirationDays = int.Parse(_configuration["JWT:RefreshTokenExpirationDays"]!);

        await _authRepository.CreateRefreshTokenAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTimeHelper.Now.AddDays(expirationDays),
            CreatedAt = DateTimeHelper.Now,
            IsRevoked = false
        });

        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserInfoDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                AuthProvider = user.AuthProvider,
                Roles = roles,
                Departments = departments
            }
        };
    }

    public async Task<OtpResponseDto> SendForgotPasswordOtpAsync(string email)
    {
        // Check if email exists
        if (!await _authRepository.EmailExistsAsync(email))
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

    public async Task<OtpResponseDto> VerifyForgotPasswordOtpAsync(string email, string otpCode)
    {
        var cacheKey = $"forgot_password_otp_{email}";
        
        if (!_cache.TryGetValue<OtpCacheData>(cacheKey, out var otpData) || otpData == null)
        {
            return new OtpResponseDto
            {
                Success = false,
                Message = "Mã OTP không hợp lệ hoặc đã hết hạn"
            };
        }

        // Check attempts
        if (otpData.Attempts >= 5)
        {
            _cache.Remove(cacheKey);
            return new OtpResponseDto
            {
                Success = false,
                Message = "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới"
            };
        }

        // Verify OTP
        if (otpData.Code == otpCode)
        {
            // Mark as verified by storing a flag
            var verifiedKey = $"forgot_password_verified_{email}";
            _cache.Set(verifiedKey, true, TimeSpan.FromMinutes(10)); // Valid for 10 minutes
            _cache.Remove(cacheKey); // Remove OTP after verification
            
            _logger.LogInformation("Forgot password OTP verified for {Email}", email);
            return new OtpResponseDto
            {
                Success = true,
                Message = "Xác thực email thành công"
            };
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

        return new OtpResponseDto
        {
            Success = false,
            Message = "Mã OTP không đúng"
        };
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
        if (user == null)
        {
            throw new InvalidOperationException("Không tìm thấy người dùng");
        }

        // Update password
        user.PasswordHash = PasswordHelper.HashPassword(newPassword);
        user.UpdatedAt = DateTimeHelper.Now;

        await _authRepository.UpdateUserAsync(user);
        
        // Remove verification flag
        _cache.Remove(verifiedKey);
        
        _logger.LogInformation("Password reset successful for {Email}", email);
        return true;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        // 1. Find user by email
        var user = await _authRepository.GetUserByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Login failed: User not found - {Email}", request.Email);
            throw new UnauthorizedAccessException("Email hoặc password không đúng");
        }

        _logger.LogInformation("User found: {Email}, PasswordHash: {HasHash}", 
            user.Email, 
            string.IsNullOrEmpty(user.PasswordHash) ? "NULL" : $"EXISTS ({user.PasswordHash.Length} chars)");

        // 2. Verify password
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            _logger.LogWarning("Login failed: PasswordHash is NULL for user {Email}", user.Email);
            throw new UnauthorizedAccessException("Email hoặc password không đúng");
        }

        var isPasswordValid = PasswordHelper.VerifyPassword(request.Password, user.PasswordHash);
        _logger.LogInformation("Password verification for {Email}: {Result}", user.Email, isPasswordValid);

        if (!isPasswordValid)
        {
            _logger.LogWarning("Login failed: Invalid password for user {Email}", user.Email);
            throw new UnauthorizedAccessException("Email hoặc password không đúng");
        }

        // 3. Check if user is active
        if (user.IsActive != true)
        {
            throw new UnauthorizedAccessException("Tài khoản đã bị vô hiệu hóa");
        }

        // 4. Get user roles and departments
        var roles = await _authRepository.GetUserRolesAsync(user.Id);
        var departments = await _authRepository.GetUserDepartmentsAsync(user.Id);

        // 5. Generate tokens
        var accessToken = _jwtTokenHelper.GenerateAccessToken(user, roles);
        string? refreshToken = null;

        if (request.RememberMe)
        {
            refreshToken = _jwtTokenHelper.GenerateRefreshToken();
            var expirationDays = int.Parse(_configuration["JWT:RefreshTokenExpirationDays"]!);
            
            await _authRepository.CreateRefreshTokenAsync(new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTimeHelper.Now.AddDays(expirationDays),
                CreatedAt = DateTimeHelper.Now,
                IsRevoked = false
            });
        }

        // 6. Return response
        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserInfoDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                AuthProvider = user.AuthProvider,
                Roles = roles,
                Departments = departments
            }
        };
    }

    public async Task<LoginResponseDto> LoginWithGoogleAsync(string code)
    {
        _logger.LogInformation("Starting Google OAuth flow with code: {CodePrefix}...", code.Substring(0, Math.Min(10, code.Length)));
        
        // 1. Exchange code for Google access token
        var tokenResponse = await ExchangeCodeForTokenAsync(code);
        _logger.LogInformation("Successfully exchanged code for Google access token");
        
        // 2. Get user info from Google
        var googleUser = await GetGoogleUserInfoAsync(tokenResponse.AccessToken);
        _logger.LogInformation("Retrieved Google user info: {Email}", googleUser.Email);

        // 3. Find or create user
        var user = await _authRepository.GetUserByGoogleIdAsync(googleUser.Sub);
        
        if (user == null)
        {
            // Find by email
            user = await _authRepository.GetUserByEmailAsync(googleUser.Email);
            
            if (user == null)
            {
                _logger.LogInformation("Creating new user from Google: {Email}", googleUser.Email);
                // Create new user
                user = await _authRepository.CreateUserAsync(new User
                {
                    FullName = googleUser.Name,
                    Email = googleUser.Email,
                    GoogleId = googleUser.Sub,
                    AuthProvider = "Google",
                    IsActive = true,
                    CreatedAt = DateTimeHelper.Now
                });
            }
            else
            {
                _logger.LogInformation("Updating existing user with Google ID: {Email}", googleUser.Email);
                // Update existing user with Google ID
                user.GoogleId = googleUser.Sub;
                user.AuthProvider = "Google";
            }
        }

        // 4. Get user roles and departments
        var roles = await _authRepository.GetUserRolesAsync(user.Id);
        var departments = await _authRepository.GetUserDepartmentsAsync(user.Id);

        // 5. Generate tokens (always create refresh token for Google login)
        var accessToken = _jwtTokenHelper.GenerateAccessToken(user, roles);
        var refreshToken = _jwtTokenHelper.GenerateRefreshToken();
        var expirationDays = int.Parse(_configuration["JWT:RefreshTokenExpirationDays"]!);

        await _authRepository.CreateRefreshTokenAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTimeHelper.Now.AddDays(expirationDays),
            CreatedAt = DateTimeHelper.Now,
            IsRevoked = false
        });

        // 6. Return response
        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserInfoDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                AuthProvider = user.AuthProvider,
                Roles = roles,
                Departments = departments
            }
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
