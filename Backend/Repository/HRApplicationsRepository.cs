using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class HRApplicationsRepository : IHRApplicationsRepository
{
    private readonly RecruitmentDbContext _context;

    public HRApplicationsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<Application>> GetApplicationsAsync(int? statusId = null)
    {
        var query = _context.Applications
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Candidate)
            .Include(a => a.JobRequest)
                .ThenInclude(jr => jr.Position)
                    .ThenInclude(p => p.Department)
            .Include(a => a.Status)
            .Where(a => a.IsDeleted == false);

        if (statusId.HasValue)
        {
            query = query.Where(a => a.StatusId == statusId.Value);
        }

        return await query
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync();
    }

    public async Task<Application?> GetApplicationByIdAsync(int id)
    {
        return await _context.Applications
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Candidate)
            .Include(a => a.JobRequest)
                .ThenInclude(jr => jr.Position)
                    .ThenInclude(p => p.Department)
            .Include(a => a.Status)
            .FirstOrDefaultAsync(a => a.Id == id && a.IsDeleted == false);
    }

    public async Task<string?> GetCvFileUrlAsync(int applicationId)
    {
        // First: check if a CV file was explicitly uploaded for this application
        var file = await _context.FileUploadeds
            .Where(f =>
                f.EntityTypeId == 3 &&
                f.FileTypeId == 1 &&
                f.EntityId == applicationId &&
                f.IsDeleted != true)
            .OrderByDescending(f => f.UploadedAt)
            .FirstOrDefaultAsync();

        if (file != null)
            return file.FileUrl;

        // Fallback: use the candidate's CV profile file URL
        var application = await _context.Applications
            .Include(a => a.Cvprofile)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.IsDeleted == false);

        return application?.Cvprofile?.CvFileUrl;
    }

    public async Task<bool> UpdateApplicationStatusAsync(int applicationId, int toStatusId, int userId, string? note = null)
    {
        var application = await _context.Applications.FindAsync(applicationId);
        if (application == null) return false;

        var fromStatusId = application.StatusId;
        application.StatusId = toStatusId;
        application.UpdatedAt = DateTimeHelper.Now;
        application.UpdatedBy = userId;

        var history = new StatusHistory
        {
            EntityTypeId = 3, // APPLICATION
            EntityId = applicationId,
            FromStatusId = fromStatusId,
            ToStatusId = toStatusId,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now,
            Note = note
        };

        _context.StatusHistories.Add(history);
        await _context.SaveChangesAsync();

        return true;
    }
}
