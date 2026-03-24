using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Candidate;
using System.Security.Claims;

namespace RMS.Controller;

/// <summary>
/// API cho candidates xem job postings công khai
/// </summary>
[ApiController]
[Route("api/candidate/job-postings")]
public class CandidateJobPostingsController : ControllerBase
{
    private readonly RecruitmentDbContext _context;

    public CandidateJobPostingsController(RecruitmentDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách tất cả job postings đang published
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PublicJobPostingListDto>>> GetPublicJobPostings()
    {
        try
        {
            // StatusId = 7 là PUBLISHED
            var today = DateOnly.FromDateTime(DateTimeHelper.Now);
            var jobPostings = await _context.JobPostings
                .Include(jp => jp.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
                .Where(jp => jp.StatusId == 7 && jp.IsDeleted == false)
                .Where(jp => jp.DeadlineDate != null && jp.DeadlineDate >= today)
                .OrderByDescending(jp => jp.CreatedAt)
                .Select(jp => new PublicJobPostingListDto
                {
                    Id = jp.Id,
                    Title = jp.Title,
                    PositionTitle = jp.JobRequest.Position.Title,
                    DepartmentName = jp.JobRequest.Position.Department.Name,
                    Location = jp.Location ?? "",
                    SalaryMin = jp.SalaryMin,
                    SalaryMax = jp.SalaryMax,
                    DeadlineDate = jp.DeadlineDate.HasValue ? jp.DeadlineDate.Value.ToDateTime(TimeOnly.MinValue) : null,
                    CreatedAt = jp.CreatedAt ?? DateTimeHelper.Now
                })
                .ToListAsync();

            return Ok(jobPostings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load job postings", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết job posting
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PublicJobPostingDetailDto>> GetJobPostingDetail(int id)
    {
        try
        {
            var today = DateOnly.FromDateTime(DateTimeHelper.Now);
            var jobPosting = await _context.JobPostings
                .Include(jp => jp.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
                .Where(jp => jp.Id == id && jp.StatusId == 7 && jp.IsDeleted == false)
                .Where(jp => jp.DeadlineDate != null && jp.DeadlineDate >= today)
                .FirstOrDefaultAsync();

            if (jobPosting == null)
            {
                return NotFound(new { message = "Job posting not found" });
            }

            // Lấy ảnh JD từ job request (do department upload lên Cloudinary)
            var jdFileUrl = await _context.FileUploadeds
                .Where(f => f.EntityTypeId == 1 && f.EntityId == jobPosting.JobRequestId && f.FileTypeId == 4)
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => f.FileUrl)
                .FirstOrDefaultAsync();

            var dto = new PublicJobPostingDetailDto
            {
                Id = jobPosting.Id,
                JobRequestId = jobPosting.JobRequestId,
                IsApplied = false,
                Title = jobPosting.Title,
                Description = jobPosting.Description ?? "",
                Requirements = jobPosting.Requirements ?? "",
                Benefits = jobPosting.Benefits ?? "",
                PositionTitle = jobPosting.JobRequest.Position.Title,
                DepartmentName = jobPosting.JobRequest.Position.Department.Name,
                Location = jobPosting.Location ?? "",
                SalaryMin = jobPosting.SalaryMin,
                SalaryMax = jobPosting.SalaryMax,
                DeadlineDate = jobPosting.DeadlineDate.HasValue ? jobPosting.DeadlineDate.Value.ToDateTime(TimeOnly.MinValue) : null,
                CreatedAt = jobPosting.CreatedAt ?? DateTimeHelper.Now,
                JdFileUrl = jdFileUrl
            };

            var candidateIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(candidateIdClaim, out var candidateId) && candidateId > 0)
            {
                dto.IsApplied = await _context.Applications
                    .AnyAsync(a =>
                        a.Cvprofile.CandidateId == candidateId &&
                        a.JobRequestId == jobPosting.JobRequestId &&
                        a.IsDeleted == false);
            }

            return Ok(dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load job posting", error = ex.Message });
        }
    }
}
