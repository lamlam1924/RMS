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
        // Query from JobPosting table
        var query = _context.JobPostings
            .Include(jp => jp.JobRequest)
            .ThenInclude(jr => jr.Position)
            .ThenInclude(p => p.Department)
            .Include(jp => jp.Status)
            .Where(jp => !jp.IsDeleted!.Value);

        if (statusId.HasValue)
        {
            query = query.Where(jp => jp.StatusId == statusId.Value);
        }

        var jobPostings = await query
            .OrderByDescending(jp => jp.CreatedAt)
            .Select(jp => new JobPostingListDto
            {
                Id = jp.Id,
                Title = jp.Title,
                PositionTitle = jp.JobRequest.Position.Title,
                DepartmentName = jp.JobRequest.Position.Department.Name,
                Quantity = jp.JobRequest.Quantity, 
                StatusId = jp.StatusId,
                CurrentStatus = jp.Status.Name,
                CreatedAt = jp.CreatedAt ?? DateTimeHelper.Now,
                PublishedAt = jp.UpdatedAt, 
                JobRequestId = jp.JobRequestId
            })
            .ToListAsync();

        return jobPostings;
    }

    public async Task<List<JobPostingListDto>> GetDraftJobPostingsAsync()
    {
        // Status 6 = Draft for Job Posting
        return await GetJobPostingsAsync(6);
    }
    
    public async Task<JobPosting> GetJobPostingByIdAsync(int id)
    {
        return await _context.JobPostings
            .Include(jp => jp.Status)
            .Include(jp => jp.JobRequest)
            .ThenInclude(jr => jr.Position)
            .ThenInclude(p => p.Department)
            .FirstOrDefaultAsync(jp => jp.Id == id && !jp.IsDeleted!.Value);
    }

    public async Task<int> CreateJobPostingAsync(JobPosting jobPosting)
    {
        _context.JobPostings.Add(jobPosting);
        await _context.SaveChangesAsync();

        // Add status history
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 2, // JobPosting EntityTypeId = 2
            EntityId = jobPosting.Id,
            ToStatusId = jobPosting.StatusId,
            ChangedBy = jobPosting.CreatedBy ?? 0,
            ChangedAt = DateTimeHelper.Now,
            Note = "Job posting created"
        };
        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return jobPosting.Id;
    }

    public async Task<bool> UpdateJobPostingAsync(JobPosting jobPosting)
    {
        _context.JobPostings.Update(jobPosting);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> PublishJobPostingAsync(int jobPostingId, int userId)
    {
        var jobPosting = await _context.JobPostings.FindAsync(jobPostingId);
        if (jobPosting == null) return false;

        // Change to PUBLISHED (7)
        var oldStatusId = jobPosting.StatusId;
        jobPosting.StatusId = 7; 
        jobPosting.UpdatedAt = DateTimeHelper.Now;
        jobPosting.UpdatedBy = userId;

        // Add status history
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 2, // JobPosting
            EntityId = jobPostingId,
            FromStatusId = oldStatusId,
            ToStatusId = 7,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now,
            Note = "Job posting published"
        };

        _context.StatusHistories.Add(statusHistory);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> CloseJobPostingAsync(int jobPostingId, string reason, int userId)
    {
        var jobPosting = await _context.JobPostings.FindAsync(jobPostingId);
        if (jobPosting == null) return false;

        // Change to CLOSED (8)
        var oldStatusId = jobPosting.StatusId;
        jobPosting.StatusId = 8;
        jobPosting.UpdatedAt = DateTimeHelper.Now;
        jobPosting.UpdatedBy = userId;

        var statusHistory = new StatusHistory
        {
            EntityTypeId = 2, // JobPosting
            EntityId = jobPostingId,
            FromStatusId = oldStatusId,
            ToStatusId = 8,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now,
            Note = $"Job posting closed. Reason: {reason}"
        };

        _context.StatusHistories.Add(statusHistory);
        return await _context.SaveChangesAsync() > 0;
    }
}
