namespace RMS.Dto.Common;

/// <summary>
/// Kết quả upload file lên Cloudinary
/// </summary>
public class CloudinaryUploadResultDto
{
    public required string PublicId { get; set; }
    public required string SecureUrl { get; set; }
}
