using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Reports;
using RMS.Entity;

namespace RMS.Controller;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class ReportsController : ControllerBase
{
    private readonly RecruitmentDbContext _context;

    public ReportsController(RecruitmentDbContext context)
    {
        _context = context;
    }

    [HttpGet("apply-daily")]
    public async Task<ActionResult<List<ApplyDailyDto>>> GetApplyDaily([FromQuery] int? jobId)
    {
        var query = _context.Applications.Where(a => a.IsDeleted == false);
        if (jobId.HasValue)
        {
            query = query.Where(a => a.JobRequestId == jobId.Value);
        }

        var grouped = await query
            .GroupBy(a => (a.AppliedAt ?? DateTime.UtcNow).Date)
            .Select(g => new
            {
                Date = g.Key,
                TotalApply = g.Count()
            })
            .OrderBy(x => x.Date) 
            .ToListAsync();

        var result = grouped
            .Select(x => new ApplyDailyDto
            {
                Date = x.Date.ToString("yyyy-MM-dd"),
                TotalApply = x.TotalApply
            })
            .ToList();

        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<RecruitmentSummaryDto>> GetSummary([FromQuery] int? jobId)
    {
        var appQuery = _context.Applications.Where(a => a.IsDeleted == false);
        if (jobId.HasValue)
        {
            appQuery = appQuery.Where(a => a.JobRequestId == jobId.Value);
        }

        var offerQuery = _context.Offers
            .Include(o => o.Application)
            .Where(o => o.IsDeleted == false);

        if (jobId.HasValue)
        {
            offerQuery = offerQuery.Where(o =>
                o.JobRequestId == jobId.Value ||
                (o.ApplicationId != null && o.Application != null && o.Application.JobRequestId == jobId.Value));
        }

        var totalApply = await appQuery.CountAsync();
        var totalOffer = await offerQuery.CountAsync();
        var totalRejectOffer = await offerQuery.CountAsync(o => o.StatusId == 20);
        var totalHired = await offerQuery.CountAsync(o => o.StatusId == 19);

        return Ok(new RecruitmentSummaryDto
        {
            TotalApply = totalApply,
            TotalOffer = totalOffer,
            TotalRejectOffer = totalRejectOffer,
            TotalHired = totalHired
        });
    }

    [HttpPost]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult> CreateReport([FromBody] CreateRecruitmentReportDto dto)
    {
        var jobExists = await _context.JobRequests.AnyAsync(j => j.Id == dto.JobId && j.IsDeleted == false);
        if (!jobExists)
        {
            return BadRequest(new { message = "JobId không tồn tại" });
        }

        var entity = new RecruitmentReport
        {
            JobId = dto.JobId,
            TotalApply = dto.TotalApply,
            TotalOffer = dto.TotalOffer,
            TotalRejectOffer = dto.TotalRejectOffer,
            TotalHired = dto.TotalHired,
            Note = dto.Note,
            CreatedAt = DateTime.UtcNow
        };

        _context.RecruitmentReports.Add(entity);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Report submitted successfully", id = entity.Id });
    }
}
