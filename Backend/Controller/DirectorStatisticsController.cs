using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/director/statistics")]
[Authorize(Roles = "DIRECTOR")]
public class DirectorStatisticsController : ControllerBase
{
    private readonly IHRStatisticsService _statisticsService;

    public DirectorStatisticsController(IHRStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    /// <summary>
    /// Get recruitment overview for Director (read-only)
    /// </summary>
    [HttpGet("overview")]
    public async Task<ActionResult<HRDashboardStatsDto>> GetRecruitmentOverview()
    {
        try
        {
            var stats = await _statisticsService.GetDashboardStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load director statistics", error = ex.Message });
        }
    }

    /// <summary>
    /// Get recruitment funnel for Director (read-only)
    /// </summary>
    [HttpGet("funnel")]
    public async Task<ActionResult<List<RecruitmentFunnelDto>>> GetRecruitmentFunnel()
    {
        try
        {
            var funnel = await _statisticsService.GetRecruitmentFunnelAsync();
            return Ok(funnel);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load director funnel", error = ex.Message });
        }
    }
}
