using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class HRJobPostingsRepository : IHRJobPostingsRepository
{
    private readonly RecruitmentDbContext _context;

    public HRJobPostingsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<JobPostingListDto>> GetJobPostingsAsync(int? statusId = null)
    {
        var query = _context.JobRequests
            .Where(jr => jr.IsDeleted == false && jr.StatusId >= 4);

        if (statusId.HasValue)
        {
            query = query.Where(jr => jr.StatusId == statusId.Value);
        }

        var jobPostings = await query
            .OrderByDescending(jr => jr.CreatedAt)
            .Select(jr => new JobPostingListDto
            {
                Id = jr.Id,
                Title = jr.Reason ?? "Untitled",
                PositionTitle = jr.Position.Title,
                DepartmentName = jr.Position.Department.Name,
                Quantity = jr.Quantity,
                StatusId = jr.StatusId,
                CurrentStatus = "",
                CreatedAt = jr.CreatedAt ?? DateTimeHelper.Now
            })
            .ToListAsync();

        foreach (var jp in jobPostings)
        {
            var latestStatus = await _context.StatusHistories
                .Include(sh => sh.ToStatus)
                .Where(sh => sh.EntityType.Code == "JobRequest" && sh.EntityId == jp.Id)
                .OrderByDescending(sh => sh.ChangedAt)
                .FirstOrDefaultAsync();
            
            jp.CurrentStatus = latestStatus?.ToStatus?.Name ?? "Unknown";
        }

        return jobPostings;
    }

    public async Task<JobRequest?> GetJobPostingByIdAsync(int id)
    {
        return await _context.JobRequests
            .Include(jr => jr.Position).ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .FirstOrDefaultAsync(jr => jr.Id == id && jr.IsDeleted == false && jr.StatusId >= 4);
    }

    public async Task<int> CreateJobPostingAsync(int positionId, int quantity, string reason, decimal? budget, DateTime? deadline, int userId)
    {
        var jobRequest = new JobRequest
        {
            PositionId = positionId,
            Quantity = quantity,
            Reason = reason,
            Budget = budget,
            Priority = 1,
            StatusId = 4,
            RequestedBy = userId,
            CreatedAt = DateTimeHelper.Now,
            CreatedBy = userId,
            IsDeleted = false
        };

        _context.JobRequests.Add(jobRequest);
        await _context.SaveChangesAsync();

        var jobRequestEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "JobRequest");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = jobRequestEntityType?.Id ?? 1,
            EntityId = jobRequest.Id,
            ToStatusId = 4,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now
        };
        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return jobRequest.Id;
    }

    public async Task<bool> UpdateJobPostingStatusAsync(int id, int statusId, int userId, string? reason = null)
    {
        var jobRequest = await _context.JobRequests.FirstOrDefaultAsync(jr => jr.Id == id && jr.IsDeleted == false);
        if (jobRequest == null) return false;

        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = statusId;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = userId;

        var jobRequestEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "JobRequest");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = jobRequestEntityType?.Id ?? 1,
            EntityId = id,
            FromStatusId = oldStatusId,
            ToStatusId = statusId,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now,
            Note = reason
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteJobPostingAsync(int id, int userId)
    {
        var jobRequest = await _context.JobRequests.FirstOrDefaultAsync(jr => jr.Id == id);
        if (jobRequest == null) return false;

        jobRequest.IsDeleted = true;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = userId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<JobPostingListDto>> GetDraftJobPostingsAsync()
    {
        var jobPostings = await _context.JobRequests
            .Where(jr => jr.IsDeleted == false && jr.StatusId == 4)
            .OrderByDescending(jr => jr.CreatedAt)
            .Select(jr => new JobPostingListDto
            {
                Id = jr.Id,
                Title = jr.Reason ?? "Untitled",
                PositionTitle = jr.Position.Title,
                DepartmentName = jr.Position.Department.Name,
                Quantity = jr.Quantity,
                StatusId = jr.StatusId,
                CurrentStatus = "",
                CreatedAt = jr.CreatedAt ?? DateTimeHelper.Now
            })
            .ToListAsync();

        foreach (var jp in jobPostings)
        {
            var latestStatus = await _context.StatusHistories
                .Include(sh => sh.ToStatus)
                .Where(sh => sh.EntityType.Code == "JobRequest" && sh.EntityId == jp.Id)
                .OrderByDescending(sh => sh.ChangedAt)
                .FirstOrDefaultAsync();
            
            jp.CurrentStatus = latestStatus?.ToStatus?.Name ?? "Unknown";
        }

        return jobPostings;
    }

    public async Task<bool> PublishJobPostingAsync(int jobPostingId, int userId)
    {
        var jobRequest = await _context.JobRequests.FirstOrDefaultAsync(jr => jr.Id == jobPostingId && jr.IsDeleted == false);
        if (jobRequest == null) return false;

        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = 5;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = userId;

        var jobRequestEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "JobRequest");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = jobRequestEntityType?.Id ?? 1,
            EntityId = jobPostingId,
            FromStatusId = oldStatusId,
            ToStatusId = 5,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CloseJobPostingAsync(int jobPostingId, string reason, int userId)
    {
        var jobRequest = await _context.JobRequests.FirstOrDefaultAsync(jr => jr.Id == jobPostingId && jr.IsDeleted == false);
        if (jobRequest == null) return false;

        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = 6;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = userId;

        var jobRequestEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "JobRequest");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = jobRequestEntityType?.Id ?? 1,
            EntityId = jobPostingId,
            FromStatusId = oldStatusId,
            ToStatusId = 6,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now,
            Note = reason
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
    }
}
