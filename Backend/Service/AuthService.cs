using System.Net.Http.Headers;
using System.Text.Json;
using RMS.Common;
using RMS.Dto.Auth;
using RMS.Entity;
using RMS.Repository;

namespace RMS.Service;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> LoginWithGoogleAsync(string code);
    Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
}

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly JwtTokenHelper _jwtTokenHelper;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IAuthRepository authRepository,
        JwtTokenHelper jwtTokenHelper,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<AuthService> logger)
    {
        _authRepository = authRepository;
        _jwtTokenHelper = jwtTokenHelper;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
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
                ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
                CreatedAt = DateTime.UtcNow,
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
                    CreatedAt = DateTime.UtcNow
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
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
            CreatedAt = DateTime.UtcNow,
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
            ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
            CreatedAt = DateTime.UtcNow,
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
