using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class HRStatisticsRepository : IHRStatisticsRepository
{
    private readonly RecruitmentDbContext _context;

    public HRStatisticsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<HRDashboardStatsDto> GetDashboardStatisticsAsync()
    {
        var stats = new HRDashboardStatsDto();

        // Pending Job Requests (SUBMITTED = 2, IN_REVIEW = 3)
        stats.PendingJobRequests = await _context.JobRequests
            .Where(jr => (jr.StatusId == 2 || jr.StatusId == 3) && jr.IsDeleted == false)
            .CountAsync();

        // Total Applications (APPLIED = 9 onwards, excluding final statuses)
        stats.TotalApplications = await _context.Applications
            .Where(a => a.StatusId >= 9 && a.StatusId <= 13 && a.IsDeleted == false)
            .CountAsync();

        // Screening Applications (SCREENING = 10)
        stats.ScreeningApplications = await _context.Applications
            .Where(a => a.StatusId == 10 && a.IsDeleted == false)
            .CountAsync();

        // Interviewing Applications (INTERVIEWING = 11)
        stats.InterviewingApplications = await _context.Applications
            .Where(a => a.StatusId == 11 && a.IsDeleted == false)
            .CountAsync();

        // Upcoming Interviews (future interviews)
        stats.UpcomingInterviews = await _context.Interviews
            .Where(i => i.StartTime > DateTimeHelper.Now && i.IsDeleted == false)
            .CountAsync();

        // Pending Offers (IN_REVIEW = 15)
        stats.PendingOffers = await _context.Offers
            .Where(o => o.StatusId == 15 && o.IsDeleted == false)
            .CountAsync();

        // Active Job Postings (PUBLISHED = 7)
        stats.ActiveJobPostings = await _context.JobRequests
            .Where(jr => jr.StatusId == 7 && jr.IsDeleted == false)
            .CountAsync();

        // Returned Job Requests (RETURNED = 21)
        stats.ReturnedJobRequestsCount = await _context.JobRequests
            .Where(jr => jr.StatusId == 21 && jr.IsDeleted == false)
            .CountAsync();

        return stats;

    }

    public async Task<List<RecruitmentFunnelDto>> GetRecruitmentFunnelAsync()
    {
        var funnel = new List<RecruitmentFunnelDto>();

        // Job Requests (SUBMITTED + IN_REVIEW)
        var jobRequestsCount = await _context.JobRequests
            .Where(jr => (jr.StatusId == 2 || jr.StatusId == 3) && jr.IsDeleted == false)
            .CountAsync();
        funnel.Add(new RecruitmentFunnelDto { Stage = "Job Requests", Count = jobRequestsCount });

        // Applications (All active)
        var applicationsCount = await _context.Applications
            .Where(a => a.StatusId >= 9 && a.StatusId <= 13 && a.IsDeleted == false)
            .CountAsync();
        funnel.Add(new RecruitmentFunnelDto { Stage = "Applications", Count = applicationsCount });

        // Screening (SCREENING = 10)
        var screeningCount = await _context.Applications
            .Where(a => a.StatusId == 10 && a.IsDeleted == false)
            .CountAsync();
        funnel.Add(new RecruitmentFunnelDto { Stage = "Screening", Count = screeningCount });

        // Interviewing (INTERVIEWING = 11)
        var interviewingCount = await _context.Applications
            .Where(a => a.StatusId == 11 && a.IsDeleted == false)
            .CountAsync();
        funnel.Add(new RecruitmentFunnelDto { Stage = "Interviewing", Count = interviewingCount });

        // Offers (IN_REVIEW + APPROVED + SENT)
        var offersCount = await _context.Offers
            .Where(o => (o.StatusId >= 15 && o.StatusId <= 18) && o.IsDeleted == false)
            .CountAsync();
        funnel.Add(new RecruitmentFunnelDto { Stage = "Offers", Count = offersCount });

        return funnel;
    }
}
