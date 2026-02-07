using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class HRJobRequestsRepository : IHRJobRequestsRepository
{
    private readonly RecruitmentDbContext _context;

    public HRJobRequestsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<JobRequest>> GetJobRequestsAsync()
    {
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => jr.IsDeleted == false)
            .OrderByDescending(jr => jr.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<JobRequest>> GetPendingJobRequestsAsync()
    {
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => (jr.StatusId == 2 || jr.StatusId == 3) && jr.IsDeleted == false)
            .OrderBy(jr => jr.Priority)
            .ThenByDescending(jr => jr.CreatedAt)
            .ToListAsync();
    }

    public async Task<JobRequest?> GetJobRequestByIdAsync(int id)
    {
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .FirstOrDefaultAsync(jr => jr.Id == id && jr.IsDeleted == false);
    }

    public async Task<List<StatusHistory>> GetStatusHistoryAsync(int entityId, string entityTypeCode)
    {
        return await _context.StatusHistories
            .Include(sh => sh.ToStatus)
            .Include(sh => sh.FromStatus)
            .Include(sh => sh.ChangedByNavigation)
            .Include(sh => sh.EntityType)
            .Where(sh => sh.EntityType.Code == entityTypeCode && sh.EntityId == entityId)
            .OrderByDescending(sh => sh.ChangedAt)
            .ToListAsync();
    }

    public async Task UpdateJobRequestAsync(JobRequest jobRequest)
    {
        _context.JobRequests.Update(jobRequest);
        await _context.SaveChangesAsync();
    }

    public async Task AddStatusHistoryAsync(StatusHistory statusHistory)
    {
        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();
    }
}
