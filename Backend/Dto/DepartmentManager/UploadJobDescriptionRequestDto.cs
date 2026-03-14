using Microsoft.AspNetCore.Http;

namespace RMS.Dto.DepartmentManager;

public class UploadJobDescriptionRequestDto
{
    public IFormFile JdFile { get; set; } = null!;
}