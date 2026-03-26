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

    public async Task<List<Application>> GetApplicationsAsync(int? statusId = null, int? scopeByStaffId = null)
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
            query = query.Where(a => a.StatusId == statusId.Value);

        if (scopeByStaffId.HasValue)
            query = query.Where(a => a.JobRequest != null && a.JobRequest.AssignedStaffId == scopeByStaffId.Value);

        return await query
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync();
    }

    public async Task<Application?> GetApplicationByIdAsync(int id)
    {
        return await _context.Applications
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Candidate)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvexperiences)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cveducations)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvcertificates)
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

    public async Task<(bool Success, string Message)> NotifyAssignedStaffCreateOfferAsync(int applicationId, int managerUserId)
    {
        var application = await _context.Applications
            .Include(a => a.JobRequest)
                .ThenInclude(jr => jr.AssignedStaff)
                    .ThenInclude(u => u.Roles)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.IsDeleted == false);

        if (application == null)
            return (false, "Hồ sơ ứng tuyển không tồn tại");

        if (application.StatusId != 12) // PASSED
            return (false, "Chỉ có thể gửi thông báo khi hồ sơ ở trạng thái PASSED");

        var assignedStaff = application.JobRequest?.AssignedStaff;
        if (assignedStaff == null)
            return (false, "Job Request chưa được gán HR Staff");

        var isHrStaff = assignedStaff.Roles.Any(r => r.Code == "HR_STAFF");
        if (!isHrStaff)
            return (false, "Người được gán hiện tại không phải HR Staff");

        var note = $"[NOTIFY_HR_STAFF_CREATE_OFFER] ManagerId={managerUserId}; StaffId={assignedStaff.Id}; StaffEmail={assignedStaff.Email}";

        var history = new StatusHistory
        {
            EntityTypeId = 3, // APPLICATION
            EntityId = applicationId,
            FromStatusId = application.StatusId,
            ToStatusId = application.StatusId,
            ChangedBy = managerUserId,
            ChangedAt = DateTimeHelper.Now,
            Note = note
        };

        _context.StatusHistories.Add(history);
        await _context.SaveChangesAsync();
        return (true, "Đã gửi thông báo cho HR Staff tạo offer");
    }

    public async Task<Dictionary<int, DateTime?>> GetOfferCreationRequestTimesAsync(List<int> applicationIds)
    {
        if (applicationIds == null || applicationIds.Count == 0)
            return new Dictionary<int, DateTime?>();

        return await _context.StatusHistories
            .Where(s =>
                s.EntityTypeId == 3 &&
                applicationIds.Contains(s.EntityId) &&
                s.Note != null &&
                s.Note.Contains("[NOTIFY_HR_STAFF_CREATE_OFFER]"))
            .GroupBy(s => s.EntityId)
            .Select(g => new
            {
                ApplicationId = g.Key,
                RequestedAt = g.Max(x => x.ChangedAt)
            })
            .ToDictionaryAsync(x => x.ApplicationId, x => x.RequestedAt);
    }

    public async Task<HashSet<int>> GetApplicationIdsHavingOfferAsync(List<int> applicationIds)
    {
        if (applicationIds == null || applicationIds.Count == 0)
            return new HashSet<int>();

        var ids = await _context.Offers
            .Where(o =>
                o.ApplicationId.HasValue &&
                applicationIds.Contains(o.ApplicationId.Value) &&
                o.IsDeleted != true)
            .Select(o => o.ApplicationId!.Value)
            .Distinct()
            .ToListAsync();

        return ids.ToHashSet();
    }
}
