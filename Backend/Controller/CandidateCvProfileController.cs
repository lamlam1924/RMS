using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Candidate;
using RMS.Entity;
using RMS.Service.Interface;

namespace RMS.Controller;

/// <summary>
/// API cho candidate quản lý CV profile của mình
/// </summary>
[ApiController]
[Route("api/candidate/cv")]
[Authorize(Roles = "CANDIDATE")]
public class CandidateCvProfileController : ControllerBase
{
    private readonly RecruitmentDbContext _context;
    private readonly ILogger<CandidateCvProfileController> _logger;
    private readonly ICloudinaryService _cloudinaryService;

    public CandidateCvProfileController(
        RecruitmentDbContext context, 
        ILogger<CandidateCvProfileController> logger,
        ICloudinaryService cloudinaryService)
    {
        _context = context;
        _logger = logger;
        _cloudinaryService = cloudinaryService;
    }

    private int? GetCandidateId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return int.TryParse(idStr, out var id) ? id : null;
    }

    /// <summary>
    /// Lấy CV profile của candidate đang đăng nhập (CV đầu tiên nếu có nhiều)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<CandidateCvProfileDto>> GetMyCv()
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized();

        var profile = await _context.Cvprofiles
            .Include(c => c.Cvexperiences.OrderBy(e => e.StartDate))
            .Include(c => c.Cveducations.OrderBy(e => e.StartYear))
            .Include(c => c.Cvcertificates.OrderBy(cert => cert.IssuedYear))
            .Where(c => c.CandidateId == candidateId)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (profile == null)
            return Ok((CandidateCvProfileDto?)null);

        var dto = new CandidateCvProfileDto
        {
            Id = profile.Id,
            CandidateId = profile.CandidateId,
            FullName = profile.FullName,
            Email = profile.Email,
            Phone = profile.Phone,
            Summary = profile.Summary,
            YearsOfExperience = profile.YearsOfExperience,
            Source = profile.Source,
            CvFileUrl = profile.CvFileUrl,
            CreatedAt = profile.CreatedAt,
            Experiences = (profile.Cvexperiences ?? new List<Cvexperience>()).Select(e => new CvExperienceDto
            {
                Id = e.Id,
                CompanyName = e.CompanyName,
                JobTitle = e.JobTitle,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                Description = e.Description
            }).ToList(),
            Educations = (profile.Cveducations ?? new List<Cveducation>()).Select(e => new CvEducationDto
            {
                Id = e.Id,
                SchoolName = e.SchoolName,
                Degree = e.Degree,
                Major = e.Major,
                StartYear = e.StartYear,
                EndYear = e.EndYear,
                Gpa = e.Gpa
            }).ToList(),
            Certificates = (profile.Cvcertificates ?? new List<Cvcertificate>()).Select(c => new CvCertificateDto
            {
                Id = c.Id,
                CertificateName = c.CertificateName,
                Issuer = c.Issuer,
                IssuedYear = c.IssuedYear
            }).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// Upload file CV
    /// </summary>
    [HttpPost("upload-file")]
    public async Task<ActionResult<CvFileUploadResponseDto>> UploadCvFile([FromForm] IFormFile file)
    {
        try
        {
            var candidateId = GetCandidateId();
            if (candidateId == null)
                return Unauthorized();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn file CV" });

            // Validate extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            string[] allowedExtensions = { ".pdf", ".doc", ".docx" };
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Chỉ chấp nhận file định dạng PDF, DOC, DOCX" });

            // Validate size (10MB)
            if (file.Length > 10 * 1024 * 1024)
                return BadRequest(new { message = "Kích thước file quá lớn (tối đa 10MB)" });

            // Upload to Cloudinary
            using var stream = file.OpenReadStream();
            var fileName = $"cv_{candidateId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            var result = await _cloudinaryService.UploadAsync(stream, fileName, "cv-files");

            // Update profile DB
            var profile = await _context.Cvprofiles.FirstOrDefaultAsync(c => c.CandidateId == candidateId);
            if (profile != null)
            {
                profile.CvFileUrl = result.SecureUrl;
                await _context.SaveChangesAsync();
            }

            return Ok(new CvFileUploadResponseDto
            {
                CvFileUrl = result.SecureUrl,
                Message = "Tải file CV lên thành công"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading CV file");
            return StatusCode(500, new { message = "Lỗi khi upload CV" });
        }
    }

    /// <summary>
    /// Tạo CV profile mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CandidateCvProfileDto>> CreateCv([FromBody] SaveCvProfileRequestDto? request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { message = "Họ tên không được để trống" });

        var candidateId = GetCandidateId();
        if (candidateId == null)
        {
            _logger.LogWarning("CreateCv: CandidateId not found in claims. NameId={NameId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
            return StatusCode(401, new { message = "Vui lòng đăng nhập với tài khoản ứng viên" });
        }

        var candidate = await _context.Candidates.FindAsync(candidateId.Value);
        if (candidate == null)
        {
            _logger.LogWarning("CreateCv: Candidate not found in DB for Id={Id}", candidateId.Value);
            return StatusCode(401, new { message = "Tài khoản ứng viên không tồn tại" });
        }

        try
        {
        var profile = new Cvprofile
        {
            CandidateId = candidateId.Value,
            FullName = request.FullName.Trim(),
            Email = request.Email?.Trim() ?? candidate.Email,
            Phone = request.Phone?.Trim() ?? candidate.Phone,
            Summary = request.Summary?.Trim(),
            YearsOfExperience = request.YearsOfExperience,
            Source = request.Source?.Trim()
        };

        _context.Cvprofiles.Add(profile);
        await _context.SaveChangesAsync();

        // Add experiences
        foreach (var exp in request.Experiences ?? [])
        {
            if (string.IsNullOrWhiteSpace(exp.CompanyName) || string.IsNullOrWhiteSpace(exp.JobTitle))
                continue;
            _context.Cvexperiences.Add(new Cvexperience
            {
                CvprofileId = profile.Id,
                CompanyName = exp.CompanyName.Trim(),
                JobTitle = exp.JobTitle.Trim(),
                StartDate = exp.StartDate,
                EndDate = exp.EndDate,
                Description = exp.Description?.Trim()
            });
        }

        // Add educations
        foreach (var edu in request.Educations ?? [])
        {
            if (string.IsNullOrWhiteSpace(edu.SchoolName))
                continue;
            _context.Cveducations.Add(new Cveducation
            {
                CvprofileId = profile.Id,
                SchoolName = edu.SchoolName.Trim(),
                Degree = edu.Degree?.Trim(),
                Major = edu.Major?.Trim(),
                StartYear = edu.StartYear,
                EndYear = edu.EndYear,
                Gpa = edu.Gpa
            });
        }

        // Add certificates
        foreach (var cert in request.Certificates ?? [])
        {
            if (string.IsNullOrWhiteSpace(cert.CertificateName))
                continue;
            _context.Cvcertificates.Add(new Cvcertificate
            {
                CvprofileId = profile.Id,
                CertificateName = cert.CertificateName.Trim(),
                Issuer = cert.Issuer?.Trim(),
                IssuedYear = cert.IssuedYear
            });
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyCv), null, await MapToDto(profile.Id));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tạo CV: " + ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật CV profile
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CandidateCvProfileDto>> UpdateCv(int id, [FromBody] SaveCvProfileRequestDto request)
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized();

        var profile = await _context.Cvprofiles
            .Include(c => c.Cvexperiences)
            .Include(c => c.Cveducations)
            .Include(c => c.Cvcertificates)
            .FirstOrDefaultAsync(c => c.Id == id && c.CandidateId == candidateId);

        if (profile == null)
            return NotFound(new { message = "CV profile not found" });

        profile.FullName = request.FullName.Trim();
        profile.Email = request.Email?.Trim();
        profile.Phone = request.Phone?.Trim();
        profile.Summary = request.Summary?.Trim();
        profile.YearsOfExperience = request.YearsOfExperience;
        profile.Source = request.Source?.Trim();

        // Compute the IDs the client wants to KEEP (sent with existing ID)
        var requestedExpIds = (request.Experiences ?? [])
            .Where(e => e.Id.HasValue).Select(e => e.Id!.Value).ToHashSet();
        var requestedEduIds = (request.Educations ?? [])
            .Where(e => e.Id.HasValue).Select(e => e.Id!.Value).ToHashSet();
        var requestedCertIds = (request.Certificates ?? [])
            .Where(c => c.Id.HasValue).Select(c => c.Id!.Value).ToHashSet();

        // ── DELETE first (before adding new ones) ──────────────────────────────
        // IMPORTANT: must run before Add() calls because EF Core navigation fixup
        // would add the new (unsaved, id=0) entities into profile.Cvexperiences,
        // causing them to be incorrectly included in the "to-remove" set.
        var toRemoveExp  = profile.Cvexperiences .Where(e => !requestedExpIds .Contains(e.Id)).ToList();
        var toRemoveEdu  = profile.Cveducations  .Where(e => !requestedEduIds .Contains(e.Id)).ToList();
        var toRemoveCert = profile.Cvcertificates.Where(c => !requestedCertIds.Contains(c.Id)).ToList();
        _context.Cvexperiences .RemoveRange(toRemoveExp);
        _context.Cveducations  .RemoveRange(toRemoveEdu);
        _context.Cvcertificates.RemoveRange(toRemoveCert);

        // ── ADD / UPDATE experiences ───────────────────────────────────────────
        foreach (var exp in request.Experiences ?? [])
        {
            if (string.IsNullOrWhiteSpace(exp.CompanyName) || string.IsNullOrWhiteSpace(exp.JobTitle))
                continue;
            if (exp.Id.HasValue)
            {
                var existing = profile.Cvexperiences.FirstOrDefault(e => e.Id == exp.Id.Value);
                if (existing != null)
                {
                    existing.CompanyName = exp.CompanyName.Trim();
                    existing.JobTitle    = exp.JobTitle.Trim();
                    existing.StartDate   = exp.StartDate;
                    existing.EndDate     = exp.EndDate;
                    existing.Description = exp.Description?.Trim();
                    continue;
                }
            }
            _context.Cvexperiences.Add(new Cvexperience
            {
                CvprofileId = profile.Id,
                CompanyName = exp.CompanyName.Trim(),
                JobTitle    = exp.JobTitle.Trim(),
                StartDate   = exp.StartDate,
                EndDate     = exp.EndDate,
                Description = exp.Description?.Trim()
            });
        }

        // ── ADD / UPDATE educations ────────────────────────────────────────────
        foreach (var edu in request.Educations ?? [])
        {
            if (string.IsNullOrWhiteSpace(edu.SchoolName))
                continue;
            if (edu.Id.HasValue)
            {
                var existing = profile.Cveducations.FirstOrDefault(e => e.Id == edu.Id.Value);
                if (existing != null)
                {
                    existing.SchoolName = edu.SchoolName.Trim();
                    existing.Degree     = edu.Degree?.Trim();
                    existing.Major      = edu.Major?.Trim();
                    existing.StartYear  = edu.StartYear;
                    existing.EndYear    = edu.EndYear;
                    existing.Gpa        = edu.Gpa;
                    continue;
                }
            }
            _context.Cveducations.Add(new Cveducation
            {
                CvprofileId = profile.Id,
                SchoolName  = edu.SchoolName.Trim(),
                Degree      = edu.Degree?.Trim(),
                Major       = edu.Major?.Trim(),
                StartYear   = edu.StartYear,
                EndYear     = edu.EndYear,
                Gpa         = edu.Gpa
            });
        }

        // ── ADD / UPDATE certificates ──────────────────────────────────────────
        foreach (var cert in request.Certificates ?? [])
        {
            if (string.IsNullOrWhiteSpace(cert.CertificateName))
                continue;
            if (cert.Id.HasValue)
            {
                var existing = profile.Cvcertificates.FirstOrDefault(c => c.Id == cert.Id.Value);
                if (existing != null)
                {
                    existing.CertificateName = cert.CertificateName.Trim();
                    existing.Issuer          = cert.Issuer?.Trim();
                    existing.IssuedYear      = cert.IssuedYear;
                    continue;
                }
            }
            _context.Cvcertificates.Add(new Cvcertificate
            {
                CvprofileId     = profile.Id,
                CertificateName = cert.CertificateName.Trim(),
                Issuer          = cert.Issuer?.Trim(),
                IssuedYear      = cert.IssuedYear
            });
        }

        await _context.SaveChangesAsync();

        return Ok(await MapToDto(profile.Id));
    }

    private async Task<CandidateCvProfileDto> MapToDto(int profileId)
    {
        var profile = await _context.Cvprofiles
            .Include(c => c.Cvexperiences.OrderBy(e => e.StartDate))
            .Include(c => c.Cveducations.OrderBy(e => e.StartYear))
            .Include(c => c.Cvcertificates.OrderBy(cert => cert.IssuedYear))
            .FirstAsync(c => c.Id == profileId);

        return new CandidateCvProfileDto
        {
            Id = profile.Id,
            CandidateId = profile.CandidateId,
            FullName = profile.FullName,
            Email = profile.Email,
            Phone = profile.Phone,
            Summary = profile.Summary,
            YearsOfExperience = profile.YearsOfExperience,
            Source = profile.Source,
            CvFileUrl = profile.CvFileUrl,
            CreatedAt = profile.CreatedAt,
            Experiences = profile.Cvexperiences.Select(e => new CvExperienceDto
            {
                Id = e.Id,
                CompanyName = e.CompanyName,
                JobTitle = e.JobTitle,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                Description = e.Description
            }).ToList(),
            Educations = profile.Cveducations.Select(e => new CvEducationDto
            {
                Id = e.Id,
                SchoolName = e.SchoolName,
                Degree = e.Degree,
                Major = e.Major,
                StartYear = e.StartYear,
                EndYear = e.EndYear,
                Gpa = e.Gpa
            }).ToList(),
            Certificates = profile.Cvcertificates.Select(c => new CvCertificateDto
            {
                Id = c.Id,
                CertificateName = c.CertificateName,
                Issuer = c.Issuer,
                IssuedYear = c.IssuedYear
            }).ToList()
        };
    }
}
