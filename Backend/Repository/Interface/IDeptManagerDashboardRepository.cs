using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IDeptManagerDashboardRepository
{
    Task<int> GetJobRequestsCountAsync(int managerId);
    Task<int> GetPendingApprovalCountAsync(int managerId);
    Task<int> GetUpcomingInterviewsCountAsync(int managerId);
    Task<int> GetActiveCandidatesCountAsync(int managerId);
    Task<Department?> GetUserDepartmentAsync(int userId);
}
