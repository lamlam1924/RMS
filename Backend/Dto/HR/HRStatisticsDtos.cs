namespace RMS.Dto.HR;

public class HRDashboardStatsDto
{
    public int PendingJobRequests { get; set; }
    public int TotalApplications { get; set; }
    public int UpcomingInterviews { get; set; }
    public int PendingOffers { get; set; }
    public int ScreeningApplications { get; set; }
    public int InterviewingApplications { get; set; }
    public int ActiveJobPostings { get; set; }
}

public class RecruitmentFunnelDto
{
    public string Stage { get; set; } = "";
    public int Count { get; set; }
}
