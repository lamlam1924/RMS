namespace RMS.Dto.Auth;

public class LoginResponseDto
{
    public string AccessToken { get; set; } = null!;
    public string? RefreshToken { get; set; }
    public UserInfoDto User { get; set; } = null!;
}

public class UserInfoDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string AuthProvider { get; set; } = null!;
    public List<string> Roles { get; set; } = new();
    public List<string> Departments { get; set; } = new();
}
