using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class HROffersRepository : IHROffersRepository
{
    private readonly RecruitmentDbContext _context;

    public HROffersRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<OfferListDto>> GetOffersAsync(int? statusId = null)
    {
        var query = _context.Offers
            .Where(o => o.IsDeleted == false);

        if (statusId.HasValue)
        {
            query = query.Where(o => o.StatusId == statusId.Value);
        }

        return await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OfferListDto
            {
                Id = o.Id,
                ApplicationId = o.ApplicationId,
                JobRequestId = o.ApplicationId != null ? o.Application.JobRequestId : o.JobRequestId ?? 0,
                CandidateName = o.ApplicationId != null ? o.Application.Cvprofile.Candidate.FullName : (o.Candidate != null ? o.Candidate.FullName : ""),
                PositionTitle = o.ApplicationId != null ? o.Application.JobRequest.Position.Title : (o.JobRequest != null ? o.JobRequest.Position.Title : ""),
                DepartmentName = o.ApplicationId != null ? o.Application.JobRequest.Position.Department.Name : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : ""),
                Salary = o.ProposedSalary ?? 0,
                Benefits = o.Benefits,
                StartDate = o.StartDate,
                StatusId = o.StatusId,
                CurrentStatus = o.Status.Name,
                CreatedAt = o.CreatedAt ?? DateTime.MinValue
            })
            .ToListAsync();
    }

    public async Task<OfferDetailDto?> GetOfferByIdAsync(int id)
    {
        var dto = await _context.Offers
            .Where(o => o.Id == id && o.IsDeleted == false)
            .Select(o => new OfferDetailDto
            {
                Id = o.Id,
                ApplicationId = o.ApplicationId,
                JobRequestId = o.ApplicationId != null ? o.Application.JobRequestId : (o.JobRequestId ?? 0),
                CandidateName = o.ApplicationId != null ? o.Application.Cvprofile.Candidate.FullName : (o.Candidate != null ? o.Candidate.FullName : ""),
                PositionTitle = o.ApplicationId != null ? o.Application.JobRequest.Position.Title : (o.JobRequest != null ? o.JobRequest.Position.Title : ""),
                DepartmentName = o.ApplicationId != null ? o.Application.JobRequest.Position.Department.Name : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : ""),
                Salary = o.ProposedSalary ?? 0,
                Benefits = o.Benefits,
                StartDate = o.StartDate,
                StatusId = o.StatusId,
                CurrentStatus = o.Status.Name,
                CreatedAt = o.CreatedAt ?? DateTime.MinValue,
                CvprofileId = o.ApplicationId != null ? o.Application.CvprofileId : (int?)null,
                CandidateId = o.ApplicationId != null ? o.Application.Cvprofile.CandidateId : (o.CandidateId ?? 0),
                CandidateResponse = o.CandidateResponse,
                CandidateRespondedAt = o.CandidateRespondedAt,
                CandidateComment = o.CandidateComment,
                SentAt = o.SentAt
            })
            .FirstOrDefaultAsync();

        if (dto != null)
        {
            dto.StatusHistory = await _context.StatusHistories
                .Where(sh => sh.EntityType.Code == "Offer" && sh.EntityId == id)
                .OrderByDescending(sh => sh.ChangedAt)
                .Select(sh => new StatusHistoryDto
                {
                    FromStatusId = sh.FromStatusId,
                    FromStatus = sh.FromStatus != null ? sh.FromStatus.Name : null,
                    ToStatusId = sh.ToStatusId,
                    ToStatus = sh.ToStatus.Name,
                    ChangedById = sh.ChangedBy,
                    ChangedByName = sh.ChangedByNavigation.FullName,
                    ChangedAt = sh.ChangedAt ?? DateTime.MinValue,
                    Note = sh.Note
                })
                .ToListAsync();
        }

        return dto;
    }

    public async Task<int> CreateOfferAsync(int candidateId, int jobRequestId, decimal salary, string? benefits, DateOnly? startDate, int userId)
    {
        var offer = new Offer
        {
            CandidateId = candidateId,
            JobRequestId = jobRequestId,
            ProposedSalary = salary,
            Benefits = benefits,
            StartDate = startDate,
            StatusId = 14, // DRAFT
            CreatedAt = DateTimeHelper.Now,
            CreatedBy = userId,
            IsDeleted = false
        };

        _context.Offers.Add(offer);
        await _context.SaveChangesAsync();

        var offerEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "Offer");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = offerEntityType?.Id ?? 4,
            EntityId = offer.Id,
            ToStatusId = 14,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now
        };
        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return offer.Id;
    }

    public async Task<bool> UpdateOfferAsync(int offerId, decimal salary, string? benefits, DateOnly? startDate, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null) return false;
        if (offer.StatusId != 14 && offer.StatusId != 15) return false; // Only DRAFT or IN_REVIEW can be edited

        offer.ProposedSalary = salary;
        offer.Benefits = benefits;
        offer.StartDate = startDate;
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = userId;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateOfferStatusAsync(int id, int statusId, int userId, string? reason = null)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == id && o.IsDeleted == false);
        if (offer == null) return false;

        var oldStatusId = offer.StatusId;
        offer.StatusId = statusId;
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = userId;
        if (statusId == 18) offer.SentAt = DateTimeHelper.Now; // SENT

        var offerEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "Offer");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = offerEntityType?.Id ?? 4,
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

    public async Task<bool> DeleteOfferAsync(int id, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == id);
        if (offer == null) return false;

        offer.IsDeleted = true;
        offer.DeletedAt = DateTimeHelper.Now;
        offer.DeletedBy = userId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<OfferListDto>> GetPendingOffersAsync()
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false && o.StatusId == 15)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OfferListDto
            {
                Id = o.Id,
                ApplicationId = o.ApplicationId,
                JobRequestId = o.ApplicationId != null ? o.Application.JobRequestId : (o.JobRequestId ?? 0),
                CandidateName = o.ApplicationId != null ? o.Application.Cvprofile.Candidate.FullName : (o.Candidate != null ? o.Candidate.FullName : ""),
                PositionTitle = o.ApplicationId != null ? o.Application.JobRequest.Position.Title : (o.JobRequest != null ? o.JobRequest.Position.Title : ""),
                DepartmentName = o.ApplicationId != null ? o.Application.JobRequest.Position.Department.Name : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : ""),
                Salary = o.ProposedSalary ?? 0,
                Benefits = o.Benefits,
                StartDate = o.StartDate,
                StatusId = o.StatusId,
                CurrentStatus = o.Status.Name,
                CreatedAt = o.CreatedAt ?? DateTime.MinValue
            })
            .ToListAsync();
    }

    public async Task<List<OfferListDto>> GetApprovedOffersAsync()
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false && o.StatusId == 16)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OfferListDto
            {
                Id = o.Id,
                ApplicationId = o.ApplicationId,
                JobRequestId = o.ApplicationId != null ? o.Application.JobRequestId : (o.JobRequestId ?? 0),
                CandidateName = o.ApplicationId != null ? o.Application.Cvprofile.Candidate.FullName : (o.Candidate != null ? o.Candidate.FullName : ""),
                PositionTitle = o.ApplicationId != null ? o.Application.JobRequest.Position.Title : (o.JobRequest != null ? o.JobRequest.Position.Title : ""),
                DepartmentName = o.ApplicationId != null ? o.Application.JobRequest.Position.Department.Name : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : ""),
                Salary = o.ProposedSalary ?? 0,
                Benefits = o.Benefits,
                StartDate = o.StartDate,
                StatusId = o.StatusId,
                CurrentStatus = o.Status.Name,
                CreatedAt = o.CreatedAt ?? DateTime.MinValue
            })
            .ToListAsync();
    }

    public async Task<bool> SendOfferAsync(int offerId, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null) return false;

        var oldStatusId = offer.StatusId;
        offer.StatusId = 18; // SENT
        offer.SentAt = DateTimeHelper.Now;

        var offerEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "Offer");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = offerEntityType?.Id ?? 4,
            EntityId = offerId,
            FromStatusId = oldStatusId,
            ToStatusId = 18,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<OfferListDto>> GetOffersForCandidateAsync(int candidateId)
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false &&
                (o.CandidateId == candidateId || (o.ApplicationId != null && o.Application.Cvprofile.CandidateId == candidateId)))
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OfferListDto
            {
                Id = o.Id,
                ApplicationId = o.ApplicationId,
                JobRequestId = o.ApplicationId != null ? o.Application.JobRequestId : (o.JobRequestId ?? 0),
                CandidateName = o.ApplicationId != null ? o.Application.Cvprofile.Candidate.FullName : (o.Candidate != null ? o.Candidate.FullName : ""),
                PositionTitle = o.ApplicationId != null ? o.Application.JobRequest.Position.Title : (o.JobRequest != null ? o.JobRequest.Position.Title : ""),
                DepartmentName = o.ApplicationId != null ? o.Application.JobRequest.Position.Department.Name : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : ""),
                Salary = o.ProposedSalary ?? 0,
                Benefits = o.Benefits,
                StartDate = o.StartDate,
                StatusId = o.StatusId,
                CurrentStatus = o.Status.Name,
                CreatedAt = o.CreatedAt ?? DateTime.MinValue
            })
            .ToListAsync();
    }

    private async Task<bool> OfferBelongsToCandidateAsync(int offerId, int candidateId)
    {
        var offer = await _context.Offers
            .AsNoTracking()
            .Where(o => o.Id == offerId && o.IsDeleted == false)
            .Select(o => new { o.CandidateId, o.ApplicationId })
            .FirstOrDefaultAsync();
        if (offer == null) return false;
        if (offer.CandidateId == candidateId) return true;
        if (offer.ApplicationId == null) return false;
        var appCandidateId = await _context.Applications
            .Where(a => a.Id == offer.ApplicationId)
            .Select(a => a.Cvprofile.CandidateId)
            .FirstOrDefaultAsync();
        return appCandidateId == candidateId;
    }

    public async Task<OfferDetailDto?> GetOfferForCandidateByIdAsync(int offerId, int candidateId)
    {
        if (!await OfferBelongsToCandidateAsync(offerId, candidateId))
            return null;

        var dto = await _context.Offers
            .Where(o => o.Id == offerId && o.IsDeleted == false)
            .Select(o => new OfferDetailDto
            {
                Id = o.Id,
                ApplicationId = o.ApplicationId,
                JobRequestId = o.ApplicationId != null ? o.Application.JobRequestId : (o.JobRequestId ?? 0),
                CandidateName = o.ApplicationId != null ? o.Application.Cvprofile.Candidate.FullName : (o.Candidate != null ? o.Candidate.FullName : ""),
                PositionTitle = o.ApplicationId != null ? o.Application.JobRequest.Position.Title : (o.JobRequest != null ? o.JobRequest.Position.Title : ""),
                DepartmentName = o.ApplicationId != null ? o.Application.JobRequest.Position.Department.Name : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : ""),
                Salary = o.ProposedSalary ?? 0,
                Benefits = o.Benefits,
                StartDate = o.StartDate,
                StatusId = o.StatusId,
                CurrentStatus = o.Status.Name,
                CreatedAt = o.CreatedAt ?? DateTime.MinValue,
                CvprofileId = o.ApplicationId != null ? o.Application.CvprofileId : (int?)null,
                CandidateId = o.ApplicationId != null ? o.Application.Cvprofile.CandidateId : (o.CandidateId ?? 0),
                CandidateResponse = o.CandidateResponse,
                CandidateRespondedAt = o.CandidateRespondedAt,
                CandidateComment = o.CandidateComment,
                SentAt = o.SentAt
            })
            .FirstOrDefaultAsync();

        if (dto != null)
        {
            dto.StatusHistory = await _context.StatusHistories
                .Where(sh => sh.EntityType.Code == "Offer" && sh.EntityId == offerId)
                .OrderByDescending(sh => sh.ChangedAt)
                .Select(sh => new StatusHistoryDto
                {
                    FromStatusId = sh.FromStatusId,
                    FromStatus = sh.FromStatus != null ? sh.FromStatus.Name : null,
                    ToStatusId = sh.ToStatusId,
                    ToStatus = sh.ToStatus.Name,
                    ChangedById = sh.ChangedBy,
                    ChangedByName = sh.ChangedByNavigation.FullName,
                    ChangedAt = sh.ChangedAt ?? DateTime.MinValue,
                    Note = sh.Note
                })
                .ToListAsync();
        }

        return dto;
    }

    public async Task<bool> CandidateRespondAsync(int offerId, string response, string? comment, int candidateId)
    {
        if (!await OfferBelongsToCandidateAsync(offerId, candidateId))
            return false;

        var offer = await _context.Offers
            .FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null) return false;
        if (offer.StatusId != 16 && offer.StatusId != 18 && offer.StatusId != 21) return false; // APPROVED, SENT, or NEGOTIATING

        var normalized = response.ToUpperInvariant();
        int newStatusId = normalized switch
        {
            "ACCEPT" => 19,
            "NEGOTIATE" => 21,
            "REJECT" => 20,
            _ => 0
        };
        if (newStatusId == 0) return false;

        offer.StatusId = newStatusId;
        offer.CandidateResponse = normalized;
        offer.CandidateRespondedAt = DateTimeHelper.Now;
        offer.CandidateComment = comment;
        offer.UpdatedAt = DateTimeHelper.Now;

        // Note: StatusHistory.ChangedBy references User; candidates don't have User records.
        // Audit trail is preserved via CandidateResponse, CandidateRespondedAt, CandidateComment on Offer.

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateOfferAfterNegotiationAsync(int offerId, decimal proposedSalary, string? benefits, DateOnly? startDate, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null || offer.StatusId != 21) return false; // Must be NEGOTIATING

        offer.ProposedSalary = proposedSalary;
        offer.Benefits = benefits;
        offer.StartDate = startDate;
        offer.CandidateResponse = null;
        offer.CandidateComment = null;
        offer.CandidateRespondedAt = null;
        offer.StatusId = 18; // SENT - resend to candidate
        offer.SentAt = DateTimeHelper.Now;
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = userId;

        var offerEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "Offer");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = offerEntityType?.Id ?? 4,
            EntityId = offerId,
            FromStatusId = 21,
            ToStatusId = 18,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
    }
}
