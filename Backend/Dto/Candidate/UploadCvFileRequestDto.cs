using Microsoft.AspNetCore.Http;

namespace RMS.Dto.Candidate;

public class UploadCvFileRequestDto
{
    public IFormFile File { get; set; } = null!;
}