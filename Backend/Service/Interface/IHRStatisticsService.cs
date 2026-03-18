using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRStatisticsService
{
    Task<HRDashboardStatsDto> GetDashboardStatisticsAsync();
    Task<List<RecruitmentFunnelDto>> GetRecruitmentFunnelAsync();
}
