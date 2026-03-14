using Microsoft.AspNetCore.Http;

namespace RMS.Dto.Auth;

public class UploadAvatarRequestDto
{
    public IFormFile File { get; set; } = null!;
}