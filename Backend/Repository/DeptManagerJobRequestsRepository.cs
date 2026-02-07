using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class DeptManagerJobRequestsRepository : IDeptManagerJobRequestsRepository
{
    private readonly RecruitmentDbContext _context;

    public DeptManagerJobRequestsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<JobRequest>> GetJobRequestsByManagerIdAsync(int managerId)
    {
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => jr.RequestedBy == managerId && !jr.IsDeleted!.Value)
            .OrderByDescending(jr => jr.CreatedAt)
            .ToListAsync();
    }

    public async Task<JobRequest?> GetJobRequestByIdAsync(int id, int managerId)
    {
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .FirstOrDefaultAsync(jr => jr.Id == id && 
                                      jr.RequestedBy == managerId && 
                                      !jr.IsDeleted!.Value);
    }

    public async Task<JobRequest> CreateJobRequestAsync(JobRequest jobRequest)
    {
        _context.JobRequests.Add(jobRequest);
        await _context.SaveChangesAsync();
        return jobRequest;
    }

    public async Task<bool> UpdateJobRequestAsync(JobRequest jobRequest)
    {
        _context.JobRequests.Update(jobRequest);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteJobRequestAsync(int id, int managerId)
    {
        var jobRequest = await GetJobRequestByIdAsync(id, managerId);
        if (jobRequest == null) return false;

        jobRequest.IsDeleted = true;
        jobRequest.DeletedAt = DateTimeHelper.Now;
        jobRequest.DeletedBy = managerId;

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> SubmitJobRequestAsync(int id, int managerId)
    {
        var jobRequest = await GetJobRequestByIdAsync(id, managerId);
        if (jobRequest == null) return false;

        var submittedStatus = await _context.Statuses
            .FirstOrDefaultAsync(s => s.Code == "SUBMITTED" && s.StatusTypeId == 1);
        
        if (submittedStatus == null) return false;

        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = submittedStatus.Id;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = managerId;

        // Add status history
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 1, // JobRequest
            EntityId = id,
            FromStatusId = oldStatusId,
            ToStatusId = submittedStatus.Id,
            ChangedBy = managerId,
            ChangedAt = DateTimeHelper.Now,
            Note = "Job request submitted for approval"
        };

        _context.StatusHistories.Add(statusHistory);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<StatusHistory>> GetJobRequestStatusHistoryAsync(int jobRequestId)
    {
        return await _context.StatusHistories
            .Include(sh => sh.ChangedByNavigation)
            .Include(sh => sh.FromStatus)
            .Include(sh => sh.ToStatus)
            .Where(sh => sh.EntityTypeId == 1 && sh.EntityId == jobRequestId)
            .OrderBy(sh => sh.ChangedAt)
            .ToListAsync();
    }

    public async Task<List<Application>> GetApplicationsByJobRequestIdAsync(int jobRequestId, int managerId)
    {
        // First verify the manager owns this job request
        var jobRequest = await _context.JobRequests
            .FirstOrDefaultAsync(jr => jr.Id == jobRequestId && 
                                      jr.RequestedBy == managerId && 
                                      !jr.IsDeleted!.Value);

        if (jobRequest == null) return new List<Application>();

        return await _context.Applications
            .Include(a => a.Cvprofile)
            .Include(a => a.Status)
            .Where(a => a.JobRequestId == jobRequestId && !a.IsDeleted!.Value)
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync();
    }

    public async Task<bool> ValidatePositionAccessAsync(int positionId, int managerId)
    {
        var position = await _context.Positions
            .Include(p => p.Department)
                .ThenInclude(d => d.UserDepartments)
            .FirstOrDefaultAsync(p => p.Id == positionId && !p.IsDeleted!.Value);

        if (position == null) return false;

        return position.Department.UserDepartments.Any(ud => ud.UserId == managerId);
    }

    public async Task<List<Position>> GetPositionsByManagerIdAsync(int managerId)
    {
        // Get all positions in departments where the manager is a member
        return await _context.Positions
            .Include(p => p.Department)
                .ThenInclude(d => d.UserDepartments)
            .Where(p => !p.IsDeleted!.Value && 
                       p.Department.UserDepartments.Any(ud => ud.UserId == managerId))
            .OrderBy(p => p.Title)
            .ToListAsync();
    }
}
