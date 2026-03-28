using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Repository.Interface;

namespace RMS.Repository;

// Helper class cho raw SQL query
public class FunnelStageCount
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class HRStatisticsRepository : IHRStatisticsRepository
{
    private readonly RecruitmentDbContext _context;

    public HRStatisticsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<HRDashboardStatsDto> GetDashboardStatisticsAsync()
    {
        var pendingRequestStatusIds = await _context.Statuses
            .AsNoTracking()
            .Where(s =>
                s.StatusType.Code == "RECRUITMENT_REQUEST"
                && (s.Code == "SUBMITTED" || s.Code == "IN_REVIEW" || s.Code == "CANCEL_PENDING"))
            .Select(s => s.Id)
            .ToListAsync();

        return new HRDashboardStatsDto
        {
            PendingJobRequests = await _context.JobRequests
                .AsNoTracking()
                .CountAsync(jr => jr.IsDeleted == false && pendingRequestStatusIds.Contains(jr.StatusId)),

            TotalApplications = await _context.Applications
                .AsNoTracking()
                .CountAsync(a => a.IsDeleted == false && a.StatusId >= 9 && a.StatusId <= 13),

            ScreeningApplications = await _context.Applications
                .AsNoTracking()
                .CountAsync(a => a.IsDeleted == false && a.StatusId == 10),

            InterviewingApplications = await _context.Applications
                .AsNoTracking()
                .CountAsync(a => a.IsDeleted == false && a.StatusId == 11),

            UpcomingInterviews = await _context.Interviews
                .AsNoTracking()
                .CountAsync(i => i.IsDeleted == false && i.StartTime > DateTime.Now),

            PendingOffers = await _context.Offers
                .AsNoTracking()
                .CountAsync(o => o.IsDeleted == false && o.StatusId == 15),

            ActiveJobPostings = await _context.JobRequests
                .AsNoTracking()
                .CountAsync(jr => jr.IsDeleted == false && jr.StatusId == 7),

            ReturnedJobRequestsCount = await _context.JobRequests
                .AsNoTracking()
                .CountAsync(jr => jr.IsDeleted == false && jr.StatusId == 21)
        };
    }

    public async Task<List<RecruitmentFunnelDto>> GetRecruitmentFunnelAsync()
    {
        var pendingRequestStatusIds = await _context.Statuses
            .AsNoTracking()
            .Where(s =>
                s.StatusType.Code == "RECRUITMENT_REQUEST"
                && (s.Code == "SUBMITTED" || s.Code == "IN_REVIEW" || s.Code == "CANCEL_PENDING"))
            .Select(s => s.Id)
            .ToListAsync();

        return new List<RecruitmentFunnelDto>
        {
            new()
            {
                Stage = "Job Requests",
                Count = await _context.JobRequests
                    .AsNoTracking()
                    .CountAsync(jr => jr.IsDeleted == false && pendingRequestStatusIds.Contains(jr.StatusId))
            },
            new()
            {
                Stage = "Applications",
                Count = await _context.Applications
                    .AsNoTracking()
                    .CountAsync(a => a.IsDeleted == false && a.StatusId >= 9 && a.StatusId <= 13)
            },
            new()
            {
                Stage = "Screening",
                Count = await _context.Applications
                    .AsNoTracking()
                    .CountAsync(a => a.IsDeleted == false && a.StatusId == 10)
            },
            new()
            {
                Stage = "Interviewing",
                Count = await _context.Applications
                    .AsNoTracking()
                    .CountAsync(a => a.IsDeleted == false && a.StatusId == 11)
            },
            new()
            {
                Stage = "Offers",
                Count = await _context.Offers
                    .AsNoTracking()
                    .CountAsync(o => o.IsDeleted == false && o.StatusId >= 15 && o.StatusId <= 18)
            }
        };
    }

    public async Task<List<HRStaffTaskSummaryDto>> GetHRStaffTaskSummariesAsync()
    {
        var approvedJobRequestStatusIds = await _context.Statuses
            .AsNoTracking()
            .Where(s => s.Code == "APPROVED" && s.StatusType.Code == "RECRUITMENT_REQUEST")
            .Select(s => s.Id)
            .ToListAsync();

        return await _context.Users
            .AsNoTracking()
            .Where(u => u.IsDeleted != true && u.IsActive == true && u.Roles.Any(r => r.Code == "HR_STAFF"))
            .Select(u => new HRStaffTaskSummaryDto
            {
                StaffId = u.Id,
                StaffName = u.FullName,
                StaffEmail = u.Email,

                JobPostingsCreated = _context.JobPostings.Count(jp =>
                    jp.IsDeleted == false && jp.CreatedBy == u.Id),

                OffersCreated = _context.Offers.Count(o =>
                    o.IsDeleted == false && o.CreatedBy == u.Id),

                OffersSentToCandidate = _context.Offers.Count(o =>
                    o.IsDeleted == false && o.CreatedBy == u.Id && o.SentAt != null),

                OffersSentToManager = _context.Offers.Count(o =>
                    o.IsDeleted == false && o.UpdatedBy == u.Id && o.SentToManagerAt != null),

                NegotiationsHandled = _context.OfferEditHistories.Count(h =>
                    h.EditedBy == u.Id),

                AssignedApprovedRequestsWithoutPosting = _context.JobRequests.Count(jr =>
                    jr.IsDeleted == false
                    && jr.AssignedStaffId == u.Id
                    && approvedJobRequestStatusIds.Contains(jr.StatusId)
                    && !jr.JobPostings.Any(jp => jp.IsDeleted == false)),

                AcceptedDeclinedOffersPendingManager = _context.Offers.Count(o =>
                    o.IsDeleted == false
                    && o.CreatedBy == u.Id
                    && (o.StatusId == 19 || o.StatusId == 20)
                    && o.SentToManagerAt == null),

                NegotiatingOffersPendingAction = _context.Offers.Count(o =>
                    o.IsDeleted == false
                    && o.CreatedBy == u.Id
                    && o.StatusId == 21)
            })
            .OrderBy(x => x.StaffName)
            .ToListAsync();
    }

    public async Task<HRStaffTaskDetailDto?> GetHRStaffTaskDetailAsync(int staffId, int recentActivityLimit = 20)
    {
        var summaries = await GetHRStaffTaskSummariesAsync();
        var summary = summaries.FirstOrDefault(s => s.StaffId == staffId);
        if (summary == null)
        {
            return null;
        }

        var approvedJobRequestStatusIds = await _context.Statuses
            .AsNoTracking()
            .Where(s => s.Code == "APPROVED" && s.StatusType.Code == "RECRUITMENT_REQUEST")
            .Select(s => s.Id)
            .ToListAsync();

        var pendingJobRequests = await _context.JobRequests
            .AsNoTracking()
            .Where(jr =>
                jr.IsDeleted == false
                && jr.AssignedStaffId == staffId
                && approvedJobRequestStatusIds.Contains(jr.StatusId)
                && !jr.JobPostings.Any(jp => jp.IsDeleted == false))
            .OrderByDescending(jr => jr.UpdatedAt ?? jr.CreatedAt)
            .Select(jr => new HRPendingJobRequestItemDto
            {
                JobRequestId = jr.Id,
                PositionTitle = jr.Position.Title,
                DepartmentName = jr.Position.Department.Name,
                AssignedAt = jr.UpdatedAt ?? jr.CreatedAt,
                CurrentStatus = _context.Statuses
                    .Where(s => s.Id == jr.StatusId)
                    .Select(s => s.Code)
                    .FirstOrDefault() ?? string.Empty
            })
            .ToListAsync();

        var pendingAcceptedDeclinedOffers = await _context.Offers
            .AsNoTracking()
            .Where(o =>
                o.IsDeleted == false
                && o.CreatedBy == staffId
                && (o.StatusId == 19 || o.StatusId == 20)
                && o.SentToManagerAt == null)
            .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
            .Select(o => new HRPendingOfferItemDto
            {
                OfferId = o.Id,
                CandidateName = o.ApplicationId != null
                    ? o.Application.Cvprofile.Candidate.FullName
                    : (o.Candidate != null ? o.Candidate.FullName : string.Empty),
                PositionTitle = o.ApplicationId != null
                    ? o.Application.JobRequest.Position.Title
                    : (o.JobRequest != null ? o.JobRequest.Position.Title : string.Empty),
                DepartmentName = o.ApplicationId != null
                    ? o.Application.JobRequest.Position.Department.Name
                    : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : string.Empty),
                CurrentStatus = o.Status.Code,
                UpdatedAt = o.UpdatedAt ?? o.CreatedAt,
                PendingReason = "Chưa gửi kết quả phản hồi ứng viên cho HR Manager"
            })
            .ToListAsync();

        var pendingNegotiationOffers = await _context.Offers
            .AsNoTracking()
            .Where(o => o.IsDeleted == false && o.CreatedBy == staffId && o.StatusId == 21)
            .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
            .Select(o => new HRPendingOfferItemDto
            {
                OfferId = o.Id,
                CandidateName = o.ApplicationId != null
                    ? o.Application.Cvprofile.Candidate.FullName
                    : (o.Candidate != null ? o.Candidate.FullName : string.Empty),
                PositionTitle = o.ApplicationId != null
                    ? o.Application.JobRequest.Position.Title
                    : (o.JobRequest != null ? o.JobRequest.Position.Title : string.Empty),
                DepartmentName = o.ApplicationId != null
                    ? o.Application.JobRequest.Position.Department.Name
                    : (o.JobRequest != null ? o.JobRequest.Position.Department.Name : string.Empty),
                CurrentStatus = o.Status.Code,
                UpdatedAt = o.UpdatedAt ?? o.CreatedAt,
                PendingReason = "Offer đang thương lượng, cần xử lý và gửi lại"
            })
            .ToListAsync();

        var pendingOffers = pendingAcceptedDeclinedOffers
            .Concat(pendingNegotiationOffers)
            .OrderByDescending(o => o.UpdatedAt)
            .ToList();

        var recentActivities = await _context.StatusHistories
            .AsNoTracking()
            .Where(sh =>
                sh.ChangedBy == staffId
                && sh.EntityType != null
                && (sh.EntityType.Code == "JOB_REQUEST"
                    || sh.EntityType.Code == "JOB_POSTING"
                    || sh.EntityType.Code == "APPLICATION"
                    || sh.EntityType.Code == "INTERVIEW"
                    || sh.EntityType.Code == "OFFER"))
            .OrderByDescending(sh => sh.ChangedAt)
            .Take(recentActivityLimit)
            .Select(sh => new HRStaffRecentActivityDto
            {
                ChangedAt = sh.ChangedAt ?? DateTime.MinValue,
                EntityType = sh.EntityType.Code,
                EntityId = sh.EntityId,
                Action = (sh.FromStatus != null ? sh.FromStatus.Code : "NONE") + " -> " + sh.ToStatus.Code,
                Note = sh.Note
            })
            .ToListAsync();

        return new HRStaffTaskDetailDto
        {
            StaffId = summary.StaffId,
            StaffName = summary.StaffName,
            StaffEmail = summary.StaffEmail,
            Summary = summary,
            PendingJobRequests = pendingJobRequests,
            PendingOffers = pendingOffers,
            RecentActivities = recentActivities
        };
    }
}
