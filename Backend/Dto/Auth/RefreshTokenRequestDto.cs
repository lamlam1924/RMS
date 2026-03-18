using System.ComponentModel.DataAnnotations;

namespace RMS.Dto.Auth;

public class RefreshTokenRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = null!;
}
