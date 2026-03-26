using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Repository.Interface;

namespace RMS.Repository;

// Helper class cho raw SQL query
public class FunnelStageCount
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class HRStatisticsRepository : IHRStatisticsRepository
{
    private readonly RecruitmentDbContext _context;

    public HRStatisticsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<HRDashboardStatsDto> GetDashboardStatisticsAsync()
    {
        // Tối ưu: Gộp tất cả truy vấn thành 1 query duy nhất
        var result = await _context.Database.SqlQueryRaw<HRDashboardStatsDto>(@"
            SELECT 
                (SELECT COUNT(*) FROM JobRequests WHERE StatusId IN (2, 3) AND IsDeleted = 0) AS PendingJobRequests,
                (SELECT COUNT(*) FROM Applications WHERE StatusId BETWEEN 9 AND 13 AND IsDeleted = 0) AS TotalApplications,
                (SELECT COUNT(*) FROM Applications WHERE StatusId = 10 AND IsDeleted = 0) AS ScreeningApplications,
                (SELECT COUNT(*) FROM Applications WHERE StatusId = 11 AND IsDeleted = 0) AS InterviewingApplications,
                (SELECT COUNT(*) FROM Interviews WHERE StartTime > GETDATE() AND IsDeleted = 0) AS UpcomingInterviews,
                (SELECT COUNT(*) FROM Offers WHERE StatusId = 15 AND IsDeleted = 0) AS PendingOffers,
                (SELECT COUNT(*) FROM JobRequests WHERE StatusId = 7 AND IsDeleted = 0) AS ActiveJobPostings,
                (SELECT COUNT(*) FROM JobRequests WHERE StatusId = 21 AND IsDeleted = 0) AS ReturnedJobRequestsCount
        ").FirstAsync();

        return result;

    }

    public async Task<List<RecruitmentFunnelDto>> GetRecruitmentFunnelAsync()
    {
        // Tối ưu: Gộp tất cả truy vấn funnel thành 1 query
        var results = await _context.Database.SqlQueryRaw<FunnelStageCount>(@"
            SELECT 'Job Requests' AS Stage, COUNT(*) AS Count FROM JobRequests WHERE StatusId IN (2, 3) AND IsDeleted = 0
            UNION ALL
            SELECT 'Applications' AS Stage, COUNT(*) AS Count FROM Applications WHERE StatusId BETWEEN 9 AND 13 AND IsDeleted = 0
            UNION ALL
            SELECT 'Screening' AS Stage, COUNT(*) AS Count FROM Applications WHERE StatusId = 10 AND IsDeleted = 0
            UNION ALL
            SELECT 'Interviewing' AS Stage, COUNT(*) AS Count FROM Applications WHERE StatusId = 11 AND IsDeleted = 0
            UNION ALL
            SELECT 'Offers' AS Stage, COUNT(*) AS Count FROM Offers WHERE StatusId BETWEEN 15 AND 18 AND IsDeleted = 0
        ").ToListAsync();

        return results.Select(r => new RecruitmentFunnelDto { Stage = r.Stage, Count = r.Count }).ToList();
    }
}
