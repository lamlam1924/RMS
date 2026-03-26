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

    private static bool IsAllowedHrTransition(int fromStatusId, int toStatusId)
    {
        // HR side only submits DRAFT offers for Director review.
        return fromStatusId == 14 && toStatusId == 15;
    }

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

    public async Task<List<OfferListDto>> GetDeclinedForStaffAsync()
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false && o.StatusId == 20 && o.SentToManagerAt == null)
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

    public async Task<List<OfferListDto>> GetAcceptedForStaffAsync()
    {
        var offers = await _context.Offers
            .Where(o => o.IsDeleted == false && o.StatusId == 19 && o.SentToManagerAt == null)
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

        // Debug logging để kiểm tra dữ liệu
        Console.WriteLine($"GetAcceptedForStaffAsync: Found {offers.Count} offers with StatusId=19");
        foreach (var offer in offers)
        {
            Console.WriteLine($"Offer ID: {offer.Id}, StatusId: {offer.StatusId}, Status: {offer.CurrentStatus}");
        }

        return offers;
    }

    public async Task<List<OfferListDto>> GetAcceptedForManagerAsync()
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false && o.StatusId == 19 && o.SentToManagerAt != null)
            .OrderByDescending(o => o.SentToManagerAt)
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

    public async Task<bool> MarkAcceptedOffersSentToManagerAsync(List<int> offerIds, int userId)
    {
        if (offerIds == null || !offerIds.Any()) return false;
        var offerIdsSet = offerIds.ToHashSet();
        // Cập nhật: Cho phép cả StatusId 19 (accepted) và 20 (declined)
        var offers = await _context.Offers
            .Where(o => offerIdsSet.Contains(o.Id) 
                && o.IsDeleted == false 
                && (o.StatusId == 19 || o.StatusId == 20) 
                && o.SentToManagerAt == null)
            .ToListAsync();
        if (!offers.Any()) return false;
        var now = DateTimeHelper.Now;
        foreach (var o in offers)
        {
            o.SentToManagerAt = now;
            o.UpdatedAt = now;
            o.UpdatedBy = userId;
        }
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<OfferListDto>> GetOffersByIdsAsync(List<int> offerIds)
    {
        if (offerIds == null || !offerIds.Any()) return new List<OfferListDto>();
        return await _context.Offers
            .Where(o => offerIds.Contains(o.Id) && o.IsDeleted == false)
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
            dto.EditHistory = await _context.OfferEditHistories
                .Where(h => h.OfferId == id)
                .OrderByDescending(h => h.EditedAt)
                .Select(h => new OfferEditHistoryDto
                {
                    Id = h.Id,
                    OfferId = h.OfferId,
                    EditedBy = h.EditedBy,
                    EditedByName = h.EditedByNavigation.FullName,
                    EditedAt = h.EditedAt,
                    Salary = h.Salary,
                    Benefits = h.Benefits,
                    StartDate = h.StartDate
                })
                .ToListAsync();
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

    public async Task<int> CreateOfferAsync(int candidateId, int jobRequestId, decimal salary, string? benefits, DateOnly? startDate, int userId, int? applicationId = null)
    {
        var offer = new Offer
        {
            CandidateId = candidateId,
            JobRequestId = jobRequestId,
            ApplicationId = applicationId,
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

    public async Task<OfferListDto?> GetOfferByApplicationIdAsync(int applicationId)
    {
        return await _context.Offers
            .Where(o => o.ApplicationId == applicationId && o.IsDeleted == false)
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
            .FirstOrDefaultAsync();
    }

    public async Task<decimal?> GetJobRequestBudgetAsync(int jobRequestId)
    {
        return await _context.JobRequests
            .AsNoTracking()
            .Where(j => j.Id == jobRequestId)
            .Select(j => j.Budget)
            .FirstOrDefaultAsync();
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
        if (!IsAllowedHrTransition(oldStatusId, statusId)) return false;

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

    public async Task<List<OfferListDto>> GetEditedOffersAsync()
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false && o.UpdatedAt != null)
            .OrderByDescending(o => o.UpdatedAt)
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
                CreatedAt = o.CreatedAt ?? DateTime.MinValue,
                UpdatedAt = o.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<List<OfferListDto>> GetPendingHRManagerOffersAsync()
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false && o.StatusId == 24)
            .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
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
                CreatedAt = o.CreatedAt ?? DateTime.MinValue,
                UpdatedAt = o.UpdatedAt,
                CandidateComment = o.CandidateComment
            })
            .ToListAsync();
    }

    public async Task<List<OfferListDto>> GetNegotiatingOffersAsync()
    {
        return await _context.Offers
            .Where(o => o.IsDeleted == false && o.StatusId == 21)
            .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
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
                CreatedAt = o.CreatedAt ?? DateTime.MinValue,
                UpdatedAt = o.UpdatedAt,
                CandidateComment = o.CandidateComment
            })
            .ToListAsync();
    }

    public async Task<bool> SaveOfferEditHistoryAsync(int offerId, decimal salary, string? benefits, DateOnly? startDate, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null || offer.StatusId != 21) return false;

        var history = new OfferEditHistory
        {
            OfferId = offerId,
            EditedBy = userId,
            EditedAt = DateTimeHelper.Now,
            Salary = salary,
            Benefits = benefits,
            StartDate = startDate
        };
        _context.OfferEditHistories.Add(history);

        offer.ProposedSalary = salary;
        offer.Benefits = benefits;
        offer.StartDate = startDate;
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = userId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<OfferEditHistoryDto>> GetOfferEditHistoryAsync(int offerId)
    {
        return await _context.OfferEditHistories
            .Where(h => h.OfferId == offerId)
            .OrderByDescending(h => h.EditedAt)
            .Select(h => new OfferEditHistoryDto
            {
                Id = h.Id,
                OfferId = h.OfferId,
                EditedBy = h.EditedBy,
                EditedByName = h.EditedByNavigation.FullName,
                EditedAt = h.EditedAt,
                Salary = h.Salary,
                Benefits = h.Benefits,
                StartDate = h.StartDate
            })
            .ToListAsync();
    }

    public async Task<bool> SubmitNegotiationToManagerAsync(int offerId, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null || offer.StatusId != 21) return false;

        var oldStatusId = offer.StatusId;
        offer.StatusId = 24; // PENDING_HR_MANAGER - HR Manager sẽ chuyển giám đốc
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = userId;

        var offerEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "Offer");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = offerEntityType?.Id ?? 4,
            EntityId = offerId,
            FromStatusId = oldStatusId,
            ToStatusId = 24,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now,
            Note = "Gửi cho HR Manager để chuyển giám đốc duyệt"
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ForwardToDirectorAsync(int offerId, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null || offer.StatusId != 24) return false; // Chỉ từ PENDING_HR_MANAGER

        var oldStatusId = offer.StatusId;
        offer.StatusId = 15; // IN_REVIEW - Director sees it
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = userId;

        var offerEntityType = await _context.EntityTypes.FirstOrDefaultAsync(et => et.Code == "Offer");
        var statusHistory = new StatusHistory
        {
            EntityTypeId = offerEntityType?.Id ?? 4,
            EntityId = offerId,
            FromStatusId = oldStatusId,
            ToStatusId = 15,
            ChangedBy = userId,
            ChangedAt = DateTimeHelper.Now,
            Note = "HR Manager đã chuyển giám đốc duyệt"
        };
        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();
        return true;
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
        // Chỉ cho phép gửi từ DRAFT (14) hoặc APPROVED (16). Không cho phép từ IN_REVIEW (15) - phải chờ Giám đốc duyệt
        if (offer.StatusId != 14 && offer.StatusId != 16) return false;

        var oldStatusId = offer.StatusId;
        offer.StatusId = 18; // SENT
        offer.SentAt = DateTimeHelper.Now;
        offer.UpdatedAt = DateTimeHelper.Now;
        offer.UpdatedBy = userId;

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

    public async Task<(string? HREmail, string CandidateName, string PositionTitle)?> GetOfferNotificationDataForHRAsync(int offerId)
    {
        var offer = await _context.Offers
            .AsNoTracking()
            .Include(o => o.Application)
            .Include(o => o.JobRequest)
            .Include(o => o.Candidate)
            .FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null) return null;

        string? hrEmail = null;
        string candidateName = "";
        string positionTitle = "";

        if (offer.ApplicationId != null && offer.Application != null)
        {
            var app = offer.Application;
            var jr = await _context.JobRequests
                .AsNoTracking()
                .Include(x => x.AssignedStaff)
                .Include(x => x.Position)
                .FirstOrDefaultAsync(x => x.Id == app.JobRequestId);
            if (jr != null)
            {
                hrEmail = jr.AssignedStaff?.Email;
                positionTitle = jr.Position?.Title ?? "";
            }
            var cv = await _context.Cvprofiles
                .AsNoTracking()
                .Include(c => c.Candidate)
                .FirstOrDefaultAsync(c => c.Id == app.CvprofileId);
            candidateName = cv?.Candidate?.FullName ?? "";
        }
        else if (offer.JobRequestId != null)
        {
            var jr = await _context.JobRequests
                .AsNoTracking()
                .Include(x => x.AssignedStaff)
                .Include(x => x.Position)
                .FirstOrDefaultAsync(x => x.Id == offer.JobRequestId);
            if (jr != null)
            {
                hrEmail = jr.AssignedStaff?.Email;
                positionTitle = jr.Position?.Title ?? "";
            }
            candidateName = offer.Candidate?.FullName ?? "";
        }

        if (string.IsNullOrEmpty(hrEmail)) return null;
        return (hrEmail, candidateName ?? "", positionTitle ?? "");
    }

    public async Task<bool> UpdateOfferAfterNegotiationAsync(int offerId, decimal proposedSalary, string? benefits, DateOnly? startDate, int userId)
    {
        var offer = await _context.Offers.FirstOrDefaultAsync(o => o.Id == offerId && o.IsDeleted == false);
        if (offer == null || offer.StatusId != 21) return false; // Must be NEGOTIATING

        // Save to edit history before updating
        var history = new OfferEditHistory
        {
            OfferId = offerId,
            EditedBy = userId,
            EditedAt = DateTimeHelper.Now,
            Salary = proposedSalary,
            Benefits = benefits,
            StartDate = startDate
        };
        _context.OfferEditHistories.Add(history);

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
