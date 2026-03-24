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
        var application = await _context.Applications
            .Include(a => a.Cvprofile)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.IsDeleted == false);

        if (application == null)
            return NotFound(new { message = "Không tìm thấy hồ sơ ứng tuyển." });

        var app = application;

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
            fileUrl = application?.Cvprofile?.CvFileUrl;
        }

        if (string.IsNullOrEmpty(fileUrl))
            return NotFound(new { message = "Không tìm thấy file CV." });

        // 3. Ưu tiên file local nếu có
        if (fileUrl.StartsWith("/uploads/"))
        {
            var absPath = System.IO.Path.Combine(
                Directory.GetCurrentDirectory(), "wwwroot",
                fileUrl.TrimStart('/').Replace('/', System.IO.Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(absPath))
                return NotFound(new { message = "File CV không tồn tại trên server." });

            var localBytes = await System.IO.File.ReadAllBytesAsync(absPath);
            return File(localBytes, "application/pdf");
        }

        // 4. Legacy Cloudinary URL
        try
        {
            var bytes = await _cloudinaryService.FetchFileAsync(fileUrl, file?.PublicId ?? string.Empty);
            return File(bytes, "application/pdf");
        }
        catch
        {
            // 5. Last fallback: CV hiện tại trong profile (nếu khác URL đã thử).
            var profileUrl = app.Cvprofile?.CvFileUrl;
            if (!string.IsNullOrWhiteSpace(profileUrl) &&
                !string.Equals(profileUrl, fileUrl, StringComparison.OrdinalIgnoreCase))
            {
                if (profileUrl.StartsWith("/uploads/"))
                {
                    var absPath = System.IO.Path.Combine(
                        Directory.GetCurrentDirectory(), "wwwroot",
                        profileUrl.TrimStart('/').Replace('/', System.IO.Path.DirectorySeparatorChar));

                    if (System.IO.File.Exists(absPath))
                    {
                        var localBytes = await System.IO.File.ReadAllBytesAsync(absPath);
                        return File(localBytes, "application/pdf");
                    }
                }

                try
                {
                    var profileFile = await _context.FileUploadeds
                        .Where(f => f.FileUrl == profileUrl && f.IsDeleted != true)
                        .OrderByDescending(f => f.UploadedAt)
                        .FirstOrDefaultAsync();

                    var bytes = await _cloudinaryService.FetchFileAsync(profileUrl, profileFile?.PublicId ?? string.Empty);
                    return File(bytes, "application/pdf");
                }
                catch
                {
                    // ignored - return message below
                }
            }

            return StatusCode(410, new { message = "CV cũ không còn khả dụng từ storage. Vui lòng tải lại CV để tiếp tục xem." });
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

        if (url.StartsWith("/uploads/"))
        {
            var absPath = System.IO.Path.Combine(
                Directory.GetCurrentDirectory(), "wwwroot",
                url.TrimStart('/').Replace('/', System.IO.Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(absPath))
                return NotFound(new { message = "File không tồn tại trên server." });

            var localBytes = await System.IO.File.ReadAllBytesAsync(absPath);
            return File(localBytes, "application/pdf");
        }

        try
        {
            var file = await _context.FileUploadeds
                .Where(f => f.FileUrl == url && f.IsDeleted != true)
                .OrderByDescending(f => f.UploadedAt)
                .FirstOrDefaultAsync();

            var bytes = await _cloudinaryService.FetchFileAsync(url, file?.PublicId ?? string.Empty);
            return File(bytes, "application/pdf");
        }
        catch
        {
            return StatusCode(410, new { message = "CV này không còn khả dụng từ storage. Vui lòng tải lại CV mới." });
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
