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

    public async Task<List<JobRequest>> GetJobRequestsByStatusAsync(string statusCode)
    {
        // Lấy status ID từ code
        var status = await _context.Statuses
            .FirstOrDefaultAsync(s => s.Code == statusCode && s.StatusType.Code == "JOB_REQUEST");
        
        if (status == null)
            return new List<JobRequest>();

        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => jr.StatusId == status.Id && jr.IsDeleted == false)
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

    public async Task<int> GetEntityTypeIdAsync(string code)
    {
        return await _context.EntityTypes
            .Where(et => et.Code == code)
            .Select(et => et.Id)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> UpdateStatusAsync(int id, int toStatusId, int changedBy, string? note)
    {
        var jobRequest = await _context.JobRequests.FindAsync(id);
        if (jobRequest == null) return false;

        int fromStatusId = jobRequest.StatusId;
        
        // Cố gắng lấy EntityTypeId động, fallback về 1 nếu thất bại
        int entityTypeId = await GetEntityTypeIdAsync("JOB_REQUEST");
        if (entityTypeId == 0) entityTypeId = 1; 

        // 1. Update JobRequest status
        jobRequest.StatusId = toStatusId;
        jobRequest.UpdatedAt = DateTime.Now;
        jobRequest.UpdatedBy = changedBy;

        // 2. Add Status History
        var history = new StatusHistory
        {
            EntityTypeId = entityTypeId,
            EntityId = id,
            FromStatusId = fromStatusId,
            ToStatusId = toStatusId,
            ChangedBy = changedBy,
            ChangedAt = DateTime.Now,
            Note = note
        };

        _context.StatusHistories.Add(history);
        
        // Luôn trả về true nếu SaveChanges thành công
        try
        {
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error in UpdateStatusAsync: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> UpdateLastReturnedAtAsync(int id, DateTime returnedAt)
    {
        var entity = await _context.JobRequests.FindAsync(id);
        if (entity == null) return false;
        
        entity.LastReturnedAt = returnedAt;
        entity.LastViewedByManagerAt = null;
        
        try
        {
            await _context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<Status?> GetStatusByCodeAsync(string code, int typeId)
    {
        return await _context.Statuses
            .FirstOrDefaultAsync(s => s.Code == code && s.StatusTypeId == typeId);
    }

    public async Task<string?> GetJdFileUrlAsync(int jobRequestId)
    {
        return await _context.FileUploadeds
            .Where(f => f.EntityTypeId == 1 && f.EntityId == jobRequestId && f.FileTypeId == 4)
            .OrderByDescending(f => f.UploadedAt)
            .Select(f => f.FileUrl)
            .FirstOrDefaultAsync();
    }
}
