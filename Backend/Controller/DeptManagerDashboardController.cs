using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.DepartmentManager;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/dept-manager/dashboard")]
[Authorize(Roles = "DEPARTMENT_MANAGER")]
public class DeptManagerDashboardController : ControllerBase
{
    private readonly IDeptManagerDashboardService _service;

    public DeptManagerDashboardController(IDeptManagerDashboardService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get dashboard statistics for department manager
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<DeptManagerDashboardStatsDto>> GetDashboardStats()
    {
        var managerId = CurrentUserHelper.GetCurrentUserId(this);
        if (managerId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var stats = await _service.GetDashboardStatsAsync(managerId);
        return Ok(stats);
    }
}
