namespace RMS.Dto.DepartmentManager;

public class DeptManagerDashboardDto
{
    public DeptManagerDashboardStatsDto Stats { get; set; } = new();
    public List<DeptManagerJobRequestListDto> RecentJobRequests { get; set; } = new();
    public List<DeptManagerInterviewListDto> UpcomingInterviews { get; set; } = new();
}
