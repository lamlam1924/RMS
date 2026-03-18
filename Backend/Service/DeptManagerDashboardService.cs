using RMS.Dto.DepartmentManager;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class DeptManagerDashboardService : IDeptManagerDashboardService
{
    private readonly IDeptManagerDashboardRepository _repository;

    public DeptManagerDashboardService(IDeptManagerDashboardRepository repository)
    {
        _repository = repository;
    }

    public async Task<DeptManagerDashboardStatsDto> GetDashboardStatsAsync(int managerId)
    {
        var myJobRequests = await _repository.GetJobRequestsCountAsync(managerId);
        var pendingApproval = await _repository.GetPendingApprovalCountAsync(managerId);
        var upcomingInterviews = await _repository.GetUpcomingInterviewsCountAsync(managerId);
        var activeCandidates = await _repository.GetActiveCandidatesCountAsync(managerId);

        return new DeptManagerDashboardStatsDto
        {
            MyJobRequests = myJobRequests,
            PendingApproval = pendingApproval,
            UpcomingInterviews = upcomingInterviews,
            ActiveCandidates = activeCandidates
        };
    }
}
