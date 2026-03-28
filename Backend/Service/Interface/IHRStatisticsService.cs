using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRStatisticsService
{
    Task<HRDashboardStatsDto> GetDashboardStatisticsAsync();
    Task<List<RecruitmentFunnelDto>> GetRecruitmentFunnelAsync();
    Task<List<HRStaffTaskSummaryDto>> GetHRStaffTaskSummariesAsync();
    Task<HRStaffTaskDetailDto?> GetHRStaffTaskDetailAsync(int staffId, int recentActivityLimit = 20);
}
