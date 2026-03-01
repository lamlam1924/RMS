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

    public async Task<bool> SubmitJobRequestAsync(int id, int managerId, string? note = null)
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
            Note = !string.IsNullOrWhiteSpace(note) ? note : "Đã nộp yêu cầu tuyển dụng để thẩm định"
        };

        _context.StatusHistories.Add(statusHistory);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> ReopenJobRequestAsync(int id, int managerId)
    {
        var jobRequest = await GetJobRequestByIdAsync(id, managerId);
        if (jobRequest == null) return false;

        // Cải thiện kiểm tra trạng thái: Chấp nhận ID 21 HOẶC Code = 'RETURNED'
        var currentStatus = await _context.Statuses.FindAsync(jobRequest.StatusId);
        if (currentStatus == null || currentStatus.Code != "RETURNED")
        {
            return false;
        }

        var draftStatus = await _context.Statuses
            .FirstOrDefaultAsync(s => (s.Code == "DRAFT" || s.Id == 1) && s.StatusTypeId == 1);
        
        if (draftStatus == null) return false;

        var oldStatusId = jobRequest.StatusId;
        bool statusChanged = oldStatusId != draftStatus.Id;

        if (statusChanged)
        {
            jobRequest.StatusId = draftStatus.Id;
            jobRequest.UpdatedAt = DateTimeHelper.Now;
            jobRequest.UpdatedBy = managerId;
        }
        
        jobRequest.LastViewedByManagerAt = DateTimeHelper.Now;

        // Luôn thêm history record nếu chưa có record Reopen gần đây 
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 1, // JobRequest
            EntityId = id,
            FromStatusId = oldStatusId,
            ToStatusId = draftStatus.Id,
            ChangedBy = managerId,
            ChangedAt = DateTimeHelper.Now,
            Note = statusChanged ? "Đã mở lại để chỉnh sửa sau khi bị trả về" : "Đồng bộ hóa trạng thái mở lại"
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
            .OrderByDescending(sh => sh.ChangedAt)
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

    public async Task<bool> UpdateLastViewedAtAsync(int id, DateTime viewedAt)
    {
        var entity = await _context.JobRequests.FindAsync(id);
        if (entity == null) return false;
        
        entity.LastViewedByManagerAt = viewedAt;
        _context.JobRequests.Update(entity);
        return await _context.SaveChangesAsync() > 0;
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

    public async Task<string?> GetJdFileUrlAsync(int jobRequestId)
    {
        return await _context.FileUploadeds
            .Where(f => f.EntityTypeId == 1 && f.EntityId == jobRequestId && f.FileTypeId == 4)
            .OrderByDescending(f => f.UploadedAt)
            .Select(f => f.FileUrl)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> CancelDirectAsync(int id, int managerId, string? note = null)
    {
        var jobRequest = await GetJobRequestByIdAsync(id, managerId);
        if (jobRequest == null) return false;

        var cancelledStatus = await _context.Statuses
            .FirstOrDefaultAsync(s => s.Code == "CANCELLED" && s.StatusTypeId == 1);
        if (cancelledStatus == null) return false;

        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = cancelledStatus.Id;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = managerId;

        var statusHistory = new StatusHistory
        {
            EntityTypeId = 1,
            EntityId = id,
            FromStatusId = oldStatusId,
            ToStatusId = cancelledStatus.Id,
            ChangedBy = managerId,
            ChangedAt = DateTimeHelper.Now,
            Note = !string.IsNullOrWhiteSpace(note) ? note : "Trưởng bộ phận đã hủy yêu cầu tuyển dụng"
        };

        _context.StatusHistories.Add(statusHistory);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> RequestCancelAsync(int id, int managerId, string? note = null)
    {
        var jobRequest = await GetJobRequestByIdAsync(id, managerId);
        if (jobRequest == null) return false;

        var cancelPendingStatus = await _context.Statuses
            .FirstOrDefaultAsync(s => s.Code == "CANCEL_PENDING" && s.StatusTypeId == 1);
        if (cancelPendingStatus == null) return false;

        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = cancelPendingStatus.Id;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = managerId;

        var statusHistory = new StatusHistory
        {
            EntityTypeId = 1,
            EntityId = id,
            FromStatusId = oldStatusId,
            ToStatusId = cancelPendingStatus.Id,
            ChangedBy = managerId,
            ChangedAt = DateTimeHelper.Now,
            Note = !string.IsNullOrWhiteSpace(note) ? note : "Trưởng bộ phận yêu cầu hủy, đang chờ HR xử lý"
        };

        _context.StatusHistories.Add(statusHistory);
        return await _context.SaveChangesAsync() > 0;
    }
}
