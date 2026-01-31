using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
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
                CandidateName = o.Application.Cvprofile.Candidate.FullName,
                PositionTitle = o.Application.JobRequest.Position.Title,
                DepartmentName = o.Application.JobRequest.Position.Department.Name,
                Salary = o.ProposedSalary ?? 0,
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
                CandidateName = o.Application.Cvprofile.Candidate.FullName,
                PositionTitle = o.Application.JobRequest.Position.Title,
                DepartmentName = o.Application.JobRequest.Position.Department.Name,
                Salary = o.ProposedSalary ?? 0,
                StatusId = o.StatusId,
                CurrentStatus = o.Status.Name,
                CreatedAt = o.CreatedAt ?? DateTime.MinValue
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
                    ChangedByName = sh.ChangedByNavigation.FullName,
                    ChangedAt = sh.ChangedAt ?? DateTime.MinValue,
                    Note = sh.Note
                })
                .ToListAsync();
        }

        return dto;
    }

    public async Task<int> CreateOfferAsync(int applicationId, decimal salary, int userId)
    {
        var offer = new Offer
        {
            ApplicationId = applicationId,
            ProposedSalary = salary,
            StatusId = 15,
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
            ToStatusId = 15,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now
        };
        _context.StatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        return offer.Id;
    }

    public async Task<bool> UpdateOfferStatusAsync(int id, int statusId, int userId, string? reason = null)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == id && o.IsDeleted == false);
        if (offer == null) return false;

        var oldStatusId = offer.StatusId;
        offer.StatusId = statusId;

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
                CandidateName = o.Application.Cvprofile.Candidate.FullName,
                PositionTitle = o.Application.JobRequest.Position.Title,
                DepartmentName = o.Application.JobRequest.Position.Department.Name,
                Salary = o.ProposedSalary ?? 0,
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
                CandidateName = o.Application.Cvprofile.Candidate.FullName,
                PositionTitle = o.Application.JobRequest.Position.Title,
                DepartmentName = o.Application.JobRequest.Position.Department.Name,
                Salary = o.ProposedSalary ?? 0,
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
        offer.StatusId = 17;

        var offerEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "Offer");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = offerEntityType?.Id ?? 4,
            EntityId = offerId,
            FromStatusId = oldStatusId,
            ToStatusId = 17,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
    }
}
