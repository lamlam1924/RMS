using Microsoft.EntityFrameworkCore;
using RMS.Common;
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
        // Use code-based lookup — never hardcode status IDs
        var pendingCodes = new[] { "SUBMITTED", "IN_REVIEW", "CANCEL_PENDING" };
        var statusIds = await _context.Statuses
            .Where(s => pendingCodes.Contains(s.Code) && s.StatusTypeId == 1)
            .Select(s => s.Id)
            .ToListAsync();

        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => statusIds.Contains(jr.StatusId) && jr.IsDeleted == false)
            .OrderBy(jr => jr.Priority)
            .ThenByDescending(jr => jr.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<JobRequest>> GetJobRequestsByStatusAsync(string statusCode)
    {
        // Lấy status ID từ code
        var status = await _context.Statuses
            .FirstOrDefaultAsync(s => s.Code == statusCode && s.StatusType.Code == "RECRUITMENT_REQUEST");
        
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
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = changedBy;

        // 2. Add Status History
        var history = new StatusHistory
        {
            EntityTypeId = entityTypeId,
            EntityId = id,
            FromStatusId = fromStatusId,
            ToStatusId = toStatusId,
            ChangedBy = changedBy,
            ChangedAt = DateTimeHelper.Now,
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

    public async Task<Status?> GetStatusByIdAsync(int statusId)
    {
        return await _context.Statuses.FindAsync(statusId);
    }

    public async Task<bool> ApproveCancelAsync(int id, int hrManagerId, string? note)
    {
        // Guard: job must currently be in CANCEL_PENDING
        var jobRequest = await GetJobRequestByIdAsync(id);
        if (jobRequest == null) return false;

        var currentStatus = await GetStatusByIdAsync(jobRequest.StatusId);
        if (currentStatus?.Code != "CANCEL_PENDING") return false;

        var cancelledStatus = await GetStatusByCodeAsync("CANCELLED", 1);
        if (cancelledStatus == null) return false;

        return await UpdateStatusAsync(id, cancelledStatus.Id, hrManagerId,
            string.IsNullOrWhiteSpace(note) ? "HR đã phê duyệt hủy yêu cầu tuyển dụng" : note);
    }

    public async Task<bool> RejectCancelAsync(int id, int hrManagerId, string? note)
    {
        // Guard: job must currently be in CANCEL_PENDING
        var jobRequest = await GetJobRequestByIdAsync(id);
        if (jobRequest == null) return false;

        var currentStatus = await GetStatusByIdAsync(jobRequest.StatusId);
        if (currentStatus?.Code != "CANCEL_PENDING") return false;

        var cancelPendingStatus = await GetStatusByCodeAsync("CANCEL_PENDING", 1);
        if (cancelPendingStatus == null) return false;

        // Find the status before CANCEL_PENDING transition
        var history = await GetStatusHistoryAsync(id, "JOB_REQUEST");
        var cancelTransition = history
            .Where(h => h.ToStatusId == cancelPendingStatus.Id)
            .OrderByDescending(h => h.ChangedAt)
            .FirstOrDefault();

        if (cancelTransition?.FromStatusId == null) return false;

        return await UpdateStatusAsync(id, cancelTransition.FromStatusId.Value, hrManagerId,
            string.IsNullOrWhiteSpace(note) ? "HR từ chối hủy, yêu cầu khôi phục trạng thái" : note);
    }

    public async Task<string?> GetJdFileUrlAsync(int jobRequestId)
    {
        return await _context.FileUploadeds
            .Where(f => f.EntityTypeId == 1 && f.EntityId == jobRequestId && f.FileTypeId == 4)
            .OrderByDescending(f => f.UploadedAt)
            .Select(f => f.FileUrl)
            .FirstOrDefaultAsync();
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

    public async Task<(bool success, string errorMessage)> AssignStaffToJobRequestAsync(int jobRequestId, int staffId, int managerId)
    {
        var jobRequest = await _context.JobRequests
            .Include(jr => jr.AssignedStaff)
            .FirstOrDefaultAsync(jr => jr.Id == jobRequestId);
        
        if (jobRequest == null)
            return (false, "Job request not found");

        // Business rule: HR Manager can assign only once; reassignment is locked.
        if (jobRequest.AssignedStaffId.HasValue)
            return (false, "Yêu cầu này đã được gán HR Staff trước đó và không thể gán lại");

        // Check if job posting already exists - cannot reassign if posting created
        var hasPosting = await _context.JobPostings
            .AnyAsync(jp => jp.JobRequestId == jobRequestId && jp.IsDeleted == false);
        
        if (hasPosting)
            return (false, "Cannot reassign: HR Staff has already created a job posting for this request");

        // Update assignment
        jobRequest.AssignedStaffId = staffId;
        await _context.SaveChangesAsync();

        return (true, "");
    }

    public async Task<List<JobRequest>> GetApprovedJobRequestsForStaffAsync(int staffId)
    {
        var approvedStatusIds = await _context.Statuses
            .Where(s => s.Code == "APPROVED" && s.StatusTypeId == 1)
            .Select(s => s.Id)
            .ToListAsync();

        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => jr.AssignedStaffId == staffId
                      && approvedStatusIds.Contains(jr.StatusId)
                      && !jr.JobPostings.Any(jp => jp.IsDeleted == false)
                      && jr.IsDeleted == false)
            .OrderByDescending(jr => jr.CreatedAt)
            .ToListAsync();
    }
}
