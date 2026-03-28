using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/statistics")]
[Authorize(Roles = "HR_MANAGER")]
public class HRStatisticsController : ControllerBase
{
    private readonly IHRStatisticsService _hrStatisticsService;

    public HRStatisticsController(IHRStatisticsService hrStatisticsService)
    {
        _hrStatisticsService = hrStatisticsService;
    }

    /// <summary>
    /// Get dashboard statistics (HR Manager only)
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<HRDashboardStatsDto>> GetDashboardStatistics()
    {
        try
        {
            var stats = await _hrStatisticsService.GetDashboardStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load statistics", error = ex.Message });
        }
    }

    /// <summary>
    /// Get recruitment funnel data (HR Manager only)
    /// </summary>
    [HttpGet("funnel")]
    public async Task<ActionResult<List<RecruitmentFunnelDto>>> GetRecruitmentFunnel()
    {
        try
        {
            var funnel = await _hrStatisticsService.GetRecruitmentFunnelAsync();
            return Ok(funnel);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load funnel", error = ex.Message });
        }
    }

    /// <summary>
    /// Get per-staff workload summary for HR Manager monitoring
    /// </summary>
    [HttpGet("staff-workload")]
    public async Task<ActionResult<List<HRStaffTaskSummaryDto>>> GetHRStaffWorkload()
    {
        try
        {
            var summaries = await _hrStatisticsService.GetHRStaffTaskSummariesAsync();
            return Ok(summaries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load HR staff workload", error = ex.Message });
        }
    }

    /// <summary>
    /// Get detailed pending tasks and recent activities for a specific HR Staff
    /// </summary>
    [HttpGet("staff-workload/{staffId:int}")]
    public async Task<ActionResult<HRStaffTaskDetailDto>> GetHRStaffWorkloadDetail(
        int staffId,
        [FromQuery] int recentActivityLimit = 20)
    {
        try
        {
            var safeLimit = Math.Clamp(recentActivityLimit, 1, 100);
            var detail = await _hrStatisticsService.GetHRStaffTaskDetailAsync(staffId, safeLimit);
            if (detail == null)
            {
                return NotFound(new { message = "HR Staff not found" });
            }

            return Ok(detail);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load HR staff workload detail", error = ex.Message });
        }
    }
}
