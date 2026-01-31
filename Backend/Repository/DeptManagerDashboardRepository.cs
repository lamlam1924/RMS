using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class DeptManagerDashboardRepository : IDeptManagerDashboardRepository
{
    private readonly RecruitmentDbContext _context;

    public DeptManagerDashboardRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<int> GetJobRequestsCountAsync(int managerId)
    {
        return await _context.JobRequests
            .CountAsync(jr => jr.RequestedBy == managerId && !jr.IsDeleted!.Value);
    }

    public async Task<int> GetPendingApprovalCountAsync(int managerId)
    {
        return await _context.JobRequests
            .CountAsync(jr => jr.RequestedBy == managerId && 
                             !jr.IsDeleted!.Value &&
                             (jr.StatusId == 1 || jr.StatusId == 2 || jr.StatusId == 3)); // DRAFT, SUBMITTED, IN_REVIEW
    }

    public async Task<int> GetUpcomingInterviewsCountAsync(int managerId)
    {
        var now = DateTime.Now;
        return await _context.InterviewParticipants
            .CountAsync(ip => ip.UserId == managerId && 
                             ip.Interview.StartTime > now &&
                             !ip.Interview.IsDeleted!.Value);
    }

    public async Task<int> GetActiveCandidatesCountAsync(int managerId)
    {
        // Count unique candidates in upcoming interviews
        var now = DateTime.Now;
        return await _context.InterviewParticipants
            .Where(ip => ip.UserId == managerId && 
                        ip.Interview.StartTime > now &&
                        !ip.Interview.IsDeleted!.Value)
            .Select(ip => ip.Interview.Application.CvprofileId)
            .Distinct()
            .CountAsync();
    }

    public async Task<Department?> GetUserDepartmentAsync(int userId)
    {
        return await _context.UserDepartments
            .Include(ud => ud.Department)
            .Where(ud => ud.UserId == userId)
            .Select(ud => ud.Department)
            .FirstOrDefaultAsync();
    }
}
