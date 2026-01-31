using RMS.Dto.DepartmentManager;

namespace RMS.Service.Interface;

public interface IDeptManagerDashboardService
{
    Task<DeptManagerDashboardStatsDto> GetDashboardStatsAsync(int managerId);
}
