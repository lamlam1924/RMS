using RMS.Dto.HR;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HRStatisticsService : IHRStatisticsService
{
    private readonly IHRStatisticsRepository _repository;

    public HRStatisticsService(IHRStatisticsRepository repository)
    {
        _repository = repository;
    }

    public async Task<HRDashboardStatsDto> GetDashboardStatisticsAsync()
    {
        return await _repository.GetDashboardStatisticsAsync();
    }

    public async Task<List<RecruitmentFunnelDto>> GetRecruitmentFunnelAsync()
    {
        return await _repository.GetRecruitmentFunnelAsync();
    }
}
