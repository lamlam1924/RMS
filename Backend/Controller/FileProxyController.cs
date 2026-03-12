using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/files")]
public class FileProxyController : ControllerBase
{
    private readonly RecruitmentDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ICloudinaryService _cloudinaryService;

    public FileProxyController(RecruitmentDbContext context, IHttpClientFactory httpClientFactory, ICloudinaryService cloudinaryService)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _cloudinaryService = cloudinaryService;
    }

    /// <summary>
    /// Proxy CV PDF với Content-Disposition inline → browser mở PDF viewer
    /// </summary>
    [AllowAnonymous]
    [HttpGet("application/{applicationId:int}/cv")]
    public async Task<IActionResult> GetApplicationCv(int applicationId)
    {
        // 1. Tìm file upload riêng cho application này
        var file = await _context.FileUploadeds
            .Where(f =>
                f.EntityTypeId == 3 &&  // APPLICATION
                f.FileTypeId == 1 &&    // CV_PDF
                f.EntityId == applicationId &&
                f.IsDeleted != true)
            .OrderByDescending(f => f.UploadedAt)
            .FirstOrDefaultAsync();

        string? fileUrl = file?.FileUrl;

        // 2. Fallback: lấy URL từ CV profile nếu không có file upload riêng
        if (string.IsNullOrEmpty(fileUrl))
        {
            var application = await _context.Applications
                .Include(a => a.Cvprofile)
                .FirstOrDefaultAsync(a => a.Id == applicationId && a.IsDeleted == false);

            fileUrl = application?.Cvprofile?.CvFileUrl;
        }

        if (string.IsNullOrEmpty(fileUrl))
            return NotFound(new { message = "Không tìm thấy file CV." });

        // 3. Fetch từ Cloudinary public URL, trả về với content-type pdf
        //    → ASP.NET Core đặt Content-Disposition: inline tự động khi không có fileDownloadName
        //    → Browser mở PDF viewer inline thay vì download
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.GetAsync(fileUrl);

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode,
                    new { message = $"Không thể tải file từ storage. Status: {(int)response.StatusCode}" });

            var bytes = await response.Content.ReadAsByteArrayAsync();
            return File(bytes, "application/pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải file.", error = ex.Message });
        }
    }

    /// <summary>
    /// Proxy CV PDF từ Cloudinary URL (dùng cho CV Profile)
    /// </summary>
    [AllowAnonymous]
    [HttpGet("cv")]
    public async Task<IActionResult> GetCvByUrl([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
            return BadRequest(new { message = "URL không hợp lệ." });

        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode,
                    new { message = $"Không thể tải file từ storage. Status: {(int)response.StatusCode}" });

            var bytes = await response.Content.ReadAsByteArrayAsync();
            return File(bytes, "application/pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tải file.", error = ex.Message });
        }
    }

    /// <summary>
    /// Proxy file mô tả công việc (JD) của một job request — không cần xác thực.
    /// Tự động phát hiện content-type từ phần mở rộng file.
    /// Nếu Cloudinary public URL bị hạn chế (401), tự động dùng signed URL.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("jd/{jobRequestId:int}")]
    public async Task<IActionResult> GetJobDescriptionFile(int jobRequestId)
    {
        var file = await _context.FileUploadeds
            .Where(f =>
                f.EntityTypeId == 1 &&   // JOB_REQUEST
                f.FileTypeId  == 4 &&    // JOB_DESCRIPTION
                f.EntityId    == jobRequestId &&
                f.IsDeleted   != true)
            .OrderByDescending(f => f.UploadedAt)
            .FirstOrDefaultAsync();

        if (file == null || string.IsNullOrEmpty(file.FileUrl))
            return NotFound(new { message = "Không tìm thấy file mô tả công việc." });

        // Determine content-type from the stored filename extension
        var urlWithoutQuery = file.FileUrl.Split('?')[0];
        var extension = Path.GetExtension(urlWithoutQuery).ToLowerInvariant();
        var contentType = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"            => "image/png",
            ".gif"            => "image/gif",
            ".webp"           => "image/webp",
            ".pdf"            => "application/pdf",
            ".doc"            => "application/msword",
            ".docx"           => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _                 => "application/octet-stream"
        };

        // Local file (uploaded after Cloudinary PDF restriction fix)
        if (file.FileUrl.StartsWith("/uploads/"))
        {
            var absPath = System.IO.Path.Combine(
                Directory.GetCurrentDirectory(), "wwwroot",
                file.FileUrl.TrimStart('/').Replace('/', System.IO.Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(absPath))
                return NotFound(new { message = "File không tìm thấy trên server." });

            var bytes = await System.IO.File.ReadAllBytesAsync(absPath);
            return File(bytes, contentType);
        }

        // Legacy Cloudinary file
        try
        {
            var bytes = await _cloudinaryService.FetchFileAsync(file.FileUrl, file.PublicId);
            return File(bytes, contentType);
        }
        catch (Exception)
        {
            return StatusCode(410, new { message = "File JD này không còn khả dụng (Cloudinary CDN restriction). Vui lòng upload lại file mới." });
        }
    }
}
