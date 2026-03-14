using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class DirectorRepository : IDirectorRepository
{
    private readonly RecruitmentDbContext _context;

    public DirectorRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    // ===== JOB REQUESTS =====

    public async Task<List<JobRequest>> GetPendingJobRequestsAsync()
    {
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => jr.StatusId == 3 && jr.IsDeleted == false) // IN_REVIEW
            .OrderBy(jr => jr.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<JobRequest>> GetProcessedJobRequestsAsync(int directorId)
    {
        // Chỉ lấy request mà chính Director này đã xử lý (có record trong StatusHistory do Director tạo)
        // Trạng thái Director có thể xử lý: APPROVED (4), REJECTED (5), RETURNED (21)
        var directorActionStatuses = new[] { 4, 5, 21 };

        // Lấy các EntityId mà director này đã tạo action trong StatusHistory
        var processedIds = await _context.StatusHistories
            .Where(sh => sh.EntityTypeId == 1  // JOB_REQUEST
                      && sh.ChangedBy == directorId
                      && directorActionStatuses.Contains(sh.ToStatusId))
            .Select(sh => sh.EntityId)
            .Distinct()
            .ToListAsync();

        if (!processedIds.Any()) return new List<JobRequest>();

        // Lấy request với status hiện tại thuộc nhóm đã xử lý bởi Director này
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
            .Where(jr => processedIds.Contains(jr.Id)
                      && directorActionStatuses.Contains(jr.StatusId)
                      && jr.IsDeleted == false)
            .OrderByDescending(jr => jr.UpdatedAt)
            .ToListAsync();
    }

    public async Task<JobRequest?> GetJobRequestDetailAsync(int id)
    {
        return await _context.JobRequests
            .Include(jr => jr.Position)
                .ThenInclude(p => p.Department)
            .Include(jr => jr.RequestedByNavigation)
                .ThenInclude(u => u.Roles)
            .Where(jr => jr.Id == id && jr.IsDeleted == false)
            .FirstOrDefaultAsync();
    }

    public async Task<List<StatusHistory>> GetJobRequestStatusHistoryAsync(int jobRequestId)
    {
        return await _context.StatusHistories
            .Include(sh => sh.ChangedByNavigation)
                .ThenInclude(u => u.Roles)
            .Include(sh => sh.ToStatus)
            .Where(sh => sh.EntityTypeId == 1 && sh.EntityId == jobRequestId) // EntityType 1 = JOB_REQUEST
            .OrderByDescending(sh => sh.ChangedAt)
            .ToListAsync();
    }

    public async Task<bool> ApproveJobRequestAsync(int jobRequestId, int directorId, string comment)
    {
        var jobRequest = await _context.JobRequests.FindAsync(jobRequestId);
        if (jobRequest == null || jobRequest.StatusId != 3) return false; // Must be IN_REVIEW

        var approvedStatusId = 4; // APPROVED status

        // Update job request status
        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = approvedStatusId;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = directorId;

        // Log status history
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 1, // JOB_REQUEST
            EntityId = jobRequestId,
            FromStatusId = oldStatusId,
            ToStatusId = approvedStatusId,
            ChangedBy = directorId,
            ChangedAt = DateTimeHelper.Now,
            Note = comment
        };

        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RejectJobRequestAsync(int jobRequestId, int directorId, string comment)
    {
        var jobRequest = await _context.JobRequests.FindAsync(jobRequestId);
        if (jobRequest == null || jobRequest.StatusId != 3) return false; // Must be IN_REVIEW

        var rejectedStatusId = 5; // REJECTED status

        // Update job request status
        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = rejectedStatusId;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = directorId;

        // Log status history
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 1, // JOB_REQUEST
            EntityId = jobRequestId,
            FromStatusId = oldStatusId,
            ToStatusId = rejectedStatusId,
            ChangedBy = directorId,
            ChangedAt = DateTimeHelper.Now,
            Note = comment
        };

        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ReturnJobRequestAsync(int jobRequestId, int directorId, string comment)
    {
        var jobRequest = await _context.JobRequests.FindAsync(jobRequestId);
        if (jobRequest == null || jobRequest.StatusId != 3) return false; // Must be IN_REVIEW

        var returnedStatusId = 21; // RETURNED status

        // Update job request status
        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = returnedStatusId;
        jobRequest.UpdatedAt = DateTimeHelper.Now;
        jobRequest.UpdatedBy = directorId;

        // Log status history
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 1, // JOB_REQUEST
            EntityId = jobRequestId,
            FromStatusId = oldStatusId,
            ToStatusId = returnedStatusId,
            ChangedBy = directorId,
            ChangedAt = DateTimeHelper.Now,
            Note = comment
        };

        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<string?> GetJdFileUrlAsync(int jobRequestId)
    {
        return await _context.FileUploadeds
            .Where(f => f.EntityTypeId == 1 && f.EntityId == jobRequestId && f.FileTypeId == 4)
            .OrderByDescending(f => f.UploadedAt)
            .Select(f => f.FileUrl)
            .FirstOrDefaultAsync();
    }

    // ===== OFFERS =====

    public async Task<List<Offer>> GetPendingOffersAsync()
    {
        return await _context.Offers
            .Include(o => o.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Candidate)
            .Include(o => o.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
            .Include(o => o.Candidate)
            .Include(o => o.JobRequest)
                .ThenInclude(jr => jr.Position)
                    .ThenInclude(p => p.Department)
            .Include(o => o.Status)
            .Where(o => o.StatusId == 15 && o.IsDeleted == false) // IN_REVIEW
            .OrderBy(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<Offer?> GetOfferDetailAsync(int id)
    {
        return await _context.Offers
            .Include(o => o.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Candidate)
            .Include(o => o.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
            .Include(o => o.Candidate)
            .Include(o => o.JobRequest)
                .ThenInclude(jr => jr.Position)
                    .ThenInclude(p => p.Department)
            .Include(o => o.Status)
            .Where(o => o.Id == id && o.IsDeleted == false)
            .FirstOrDefaultAsync();
    }

    public async Task<List<OfferApproval>> GetOfferApprovalHistoryAsync(int offerId)
    {
        return await _context.OfferApprovals
            .Include(oa => oa.Approver)
                .ThenInclude(u => u.Roles)
            .Where(oa => oa.OfferId == offerId)
            .OrderBy(oa => oa.ApprovedAt)
            .ToListAsync();
    }

    public async Task<bool> ApproveOfferAsync(int offerId, int directorId, string comment)
    {
        var offer = await _context.Offers.FindAsync(offerId);
        if (offer == null || offer.StatusId != 15) return false; // Must be IN_REVIEW

        var approvedStatusId = 16; // APPROVED status
        var oldStatusId = offer.StatusId;

        // Update offer status
        offer.StatusId = approvedStatusId;
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = directorId;

        // Add approval record
        var approval = new OfferApproval
        {
            OfferId = offerId,
            ApproverId = directorId,
            Decision = "APPROVED",
            Comment = comment,
            ApprovedAt = DateTimeHelper.Now
        };

        _context.OfferApprovals.Add(approval);

        var statusHistory = new StatusHistory
        {
            EntityTypeId = 4, // OFFER
            EntityId = offerId,
            FromStatusId = oldStatusId,
            ToStatusId = approvedStatusId,
            ChangedBy = directorId,
            ChangedAt = DateTimeHelper.Now,
            Note = comment
        };

        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RejectOfferAsync(int offerId, int directorId, string comment)
    {
        var offer = await _context.Offers.FindAsync(offerId);
        if (offer == null || offer.StatusId != 15) return false; // Must be IN_REVIEW

        var rejectedStatusId = 17; // REJECTED status
        var oldStatusId = offer.StatusId;

        // Update offer status
        offer.StatusId = rejectedStatusId;
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = directorId;

        // Add approval record
        var approval = new OfferApproval
        {
            OfferId = offerId,
            ApproverId = directorId,
            Decision = "REJECTED",
            Comment = comment,
            ApprovedAt = DateTimeHelper.Now
        };

        _context.OfferApprovals.Add(approval);

        var statusHistory = new StatusHistory
        {
            EntityTypeId = 4, // OFFER
            EntityId = offerId,
            FromStatusId = oldStatusId,
            ToStatusId = rejectedStatusId,
            ChangedBy = directorId,
            ChangedAt = DateTimeHelper.Now,
            Note = comment
        };

        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<Dictionary<int, string>> GetStatusNamesAsync(IEnumerable<int> statusIds)
    {
        return await _context.Statuses
            .Where(s => statusIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name);
    }

    public async Task<Dictionary<int, string>> GetStatusCodesAsync(IEnumerable<int> statusIds)
    {
        return await _context.Statuses
            .Where(s => statusIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Code);
    }
}
