using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Candidate;

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
            var today = DateOnly.FromDateTime(DateTime.Now);
            var jobPostings = await _context.JobPostings
                .Include(jp => jp.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
                .Where(jp => jp.StatusId == 7 && jp.IsDeleted == false)
                .Where(jp => jp.DeadlineDate == null || jp.DeadlineDate >= today)
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
                    CreatedAt = jp.CreatedAt ?? DateTime.Now
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
            var jobPosting = await _context.JobPostings
                .Include(jp => jp.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
                .Where(jp => jp.Id == id && jp.StatusId == 7 && jp.IsDeleted == false)
                .Select(jp => new PublicJobPostingDetailDto
                {
                    Id = jp.Id,
                    Title = jp.Title,
                    Description = jp.Description ?? "",
                    Requirements = jp.Requirements ?? "",
                    Benefits = jp.Benefits ?? "",
                    PositionTitle = jp.JobRequest.Position.Title,
                    DepartmentName = jp.JobRequest.Position.Department.Name,
                    Location = jp.Location ?? "",
                    SalaryMin = jp.SalaryMin,
                    SalaryMax = jp.SalaryMax,
                    DeadlineDate = jp.DeadlineDate.HasValue ? jp.DeadlineDate.Value.ToDateTime(TimeOnly.MinValue) : null,
                    CreatedAt = jp.CreatedAt ?? DateTime.Now
                })
                .FirstOrDefaultAsync();

            if (jobPosting == null)
            {
                return NotFound(new { message = "Job posting not found" });
            }

            return Ok(jobPosting);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load job posting", error = ex.Message });
        }
    }
}
