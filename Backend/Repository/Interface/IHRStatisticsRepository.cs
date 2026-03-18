using RMS.Dto.HR;

namespace RMS.Repository.Interface;

public interface IHRStatisticsRepository
{
    Task<HRDashboardStatsDto> GetDashboardStatisticsAsync();
    Task<List<RecruitmentFunnelDto>> GetRecruitmentFunnelAsync();
}
