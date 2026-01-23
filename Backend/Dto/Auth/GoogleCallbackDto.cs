using System.ComponentModel.DataAnnotations;

namespace RMS.Dto.Auth;

public class GoogleCallbackDto
{
    [Required]
    public string Code { get; set; } = null!;
}

public class GoogleUserInfo
{
    public string Sub { get; set; } = null!; // Google ID
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Picture { get; set; } = null!;
    public bool EmailVerified { get; set; }
}
