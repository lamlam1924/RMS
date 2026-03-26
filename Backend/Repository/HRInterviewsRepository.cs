using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;
using RMS.Common;

namespace RMS.Repository;

public class HRInterviewsRepository : IHRInterviewsRepository
{
    private readonly RecruitmentDbContext _context;
    private readonly IInterviewConflictService _conflictService;

    public HRInterviewsRepository(
        RecruitmentDbContext context,
        IInterviewConflictService conflictService)
    {
        _context = context;
        _conflictService = conflictService;
    }

    private async Task<int> GetStatusIdAsync(string code)
        => await _context.Statuses.Where(s => s.Code == code).Select(s => s.Id).FirstAsync();

    /// <summary>Application status (StatusTypeId = 3): SCREENING = 10, INTERVIEWING = 11.</summary>
    private async Task<int?> GetApplicationStatusIdByCodeAsync(string code)
        => await _context.Statuses.Where(s => s.StatusTypeId == 3 && s.Code == code).Select(s => (int?)s.Id).FirstOrDefaultAsync();

    public async Task<List<InterviewListDto>> GetInterviewsAsync(int? scopeByStaffId = null)
    {
        var list = await BuildInterviewQuery(scopeByStaffId)
            .Where(i => i.IsDeleted == false)
            .OrderByDescending(i => i.StartTime)
            .ToListAsync();
        return list.Select(ToListDto).ToList();
    }

    public async Task<List<InterviewListDto>> GetUpcomingInterviewsAsync(int? scopeByStaffId = null)
    {
        var list = await BuildInterviewQuery(scopeByStaffId)
            .Where(i => i.IsDeleted == false && i.StartTime > DateTimeHelper.Now)
            .OrderBy(i => i.StartTime)
            .ToListAsync();
        return list.Select(ToListDto).ToList();
    }

    public async Task<List<InterviewNeedingAttentionDto>> GetInterviewsNeedingAttentionAsync(int? scopeByStaffId = null)
    {
        var query = BuildInterviewQuery(scopeByStaffId)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(p => p.User)
            .Where(i => i.IsDeleted == false)
            .Where(i => (i.CandidateDeclineNote != null && i.CandidateDeclineNote != "")
                || i.InterviewParticipants.Any(p => p.DeclinedAt != null));
        var list = await query
            .OrderByDescending(i => i.StartTime)
            .Take(50)
            .ToListAsync();
        return list.Select(i =>
        {
            var declinedNames = i.InterviewParticipants?
                .Where(p => p.DeclinedAt.HasValue)
                .Select(p => p.User?.FullName ?? "Người phỏng vấn")
                .Where(n => !string.IsNullOrEmpty(n))
                .Distinct()
                .ToList() ?? new List<string>();
            return new InterviewNeedingAttentionDto
            {
                InterviewId = i.Id,
                CandidateName = i.Application?.Cvprofile?.Candidate?.FullName ?? "",
                PositionTitle = i.Application?.JobRequest?.Position?.Title ?? "",
                DepartmentName = i.Application?.JobRequest?.Position?.Department?.Name ?? "",
                StartTime = i.StartTime,
                StatusCode = i.Status?.Code ?? "",
                StatusName = i.Status?.Name ?? "",
                CandidateDeclined = !string.IsNullOrWhiteSpace(i.CandidateDeclineNote),
                CandidateDeclineNote = i.CandidateDeclineNote,
                DeclinedParticipantNames = declinedNames
            };
        }).ToList();
    }

    public async Task<bool> IsInterviewInStaffScopeAsync(int interviewId, int staffId)
    {
        var assignedId = await _context.Interviews
            .Where(i => i.Id == interviewId && i.IsDeleted == false)
            .Select(i => i.Application.JobRequest.AssignedStaffId)
            .FirstOrDefaultAsync();
        return assignedId == staffId;
    }

    public async Task<int?> GetApplicationAssignedStaffIdAsync(int applicationId)
    {
        return await _context.Applications
            .Where(a => a.Id == applicationId && a.IsDeleted != true)
            .Select(a => a.JobRequest.AssignedStaffId)
            .FirstOrDefaultAsync();
    }

    public async Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int? scopeByStaffId = null)
    {
        var i = await BuildInterviewQuery(scopeByStaffId)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(p => p.User)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(p => p.InterviewRole)
            .Include(i => i.InterviewFeedbacks)
                .ThenInclude(f => f.Interviewer)
            .Include(i => i.InterviewFeedbacks)
                .ThenInclude(f => f.InterviewScores)
                    .ThenInclude(s => s.Criteria)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.IsDeleted == false);

        if (i == null) return null;

        var submittedIds = i.InterviewFeedbacks.Select(f => f.InterviewerId).ToHashSet();

        var dto = ToDetailDto(i);
        // Chỉ hiển thị những người được đề cử/đang chờ hoặc đã xác nhận tham gia (bỏ qua những người đã từ chối)
        dto.Participants = i.InterviewParticipants
            .Where(p => !p.DeclinedAt.HasValue)
            .Select(p => new InterviewParticipantItemDto
            {
                UserId = p.UserId,
                UserName = p.User.FullName,
                Email = p.User.Email,
                InterviewRoleCode = p.InterviewRole?.Code ?? "",
                InterviewRoleName = p.InterviewRole?.Name ?? "",
                HasSubmittedFeedback = submittedIds.Contains(p.UserId),
                ConfirmedAt = p.ConfirmedAt,
                DeclinedAt = p.DeclinedAt,
                DeclineNote = p.DeclineNote
            })
            .ToList();
        dto.CandidateDeclineNote = i.CandidateDeclineNote;

        dto.Feedbacks = i.InterviewFeedbacks.Select(f => new InterviewFeedbackItemDto
        {
            Id = f.Id,
            InterviewerId = f.InterviewerId,
            InterviewerName = f.Interviewer.FullName,
            Recommendation = f.Recommendation,
            Note = f.Note,
            CreatedAt = f.CreatedAt,
            Scores = f.InterviewScores.Select(s => new InterviewScoreItemDto
            {
                CriteriaName = s.Criteria.Name,
                Weight = s.Criteria.Weight,
                Score = s.Score
            }).ToList()
        }).ToList();

        var roundDecision = await _context.InterviewRoundDecisions
            .Include(d => d.DecidedByNavigation)
            .FirstOrDefaultAsync(d => d.InterviewId == interviewId);

        if (roundDecision != null)
        {
            dto.RoundDecision = new InterviewRoundDecisionDto
            {
                InterviewId = roundDecision.InterviewId,
                DecisionCode = roundDecision.DecisionCode,
                Note = roundDecision.Note,
                DecidedBy = roundDecision.DecidedBy,
                DecidedByName = roundDecision.DecidedByNavigation.FullName,
                DecidedAt = roundDecision.DecidedAt
            };
        }

        return dto;
    }

    public async Task<(int interviewId, string? conflictWarning)> CreateInterviewAsync(
        CreateInterviewDto dto, int userId)
    {
        // Auto RoundNo
        var roundNo = await _context.Interviews
            .Where(i => i.ApplicationId == dto.ApplicationId && i.IsDeleted == false)
            .MaxAsync(i => (int?)i.RoundNo) ?? 0;
        roundNo++;

        // Get interviewer IDs from participants
        var interviewerIds = dto.Participants.Select(p => p.UserId).ToList();

        // Check conflicts using service
        var conflictResult = await _conflictService.CheckAllConflictsAsync(
            dto.ApplicationId,
            interviewerIds,
            dto.StartTime,
            dto.EndTime);

        string? conflictWarning = null;

        if (conflictResult.HasConflicts)
        {
            var messages = conflictResult.Conflicts
                .Select(c => c.ConflictType == "INTERVIEWER"
                    ? $"{c.UserName} đã có lịch phỏng vấn trùng giờ (ID: {c.ConflictingInterviewId})"
                    : $"Ứng viên {c.CandidateName} đã có lịch phỏng vấn khác")
                .ToList();

            conflictWarning = string.Join(". ", messages);

            // Block if ERROR conflicts and not ignored
            if (!dto.IgnoreConflicts && !conflictResult.CanProceed)
            {
                throw new InvalidOperationException(
                    $"Không thể tạo interview do có conflicts: {conflictWarning}");
            }
        }

        var scheduledId = await GetStatusIdAsync("SCHEDULED");

        var interview = new Interview
        {
            ApplicationId = dto.ApplicationId,
            RoundNo = roundNo,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Location = dto.Location,
            MeetingLink = dto.MeetingLink,
            StatusId = scheduledId,
            CreatedAt = DateTimeHelper.Now,
            CreatedBy = userId,
            IsDeleted = false,
            RescheduledCount = 0
        };

        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

        // Chuyển Application từ SCREENING → INTERVIEWING khi vừa xếp lịch
        var application = await _context.Applications.FindAsync(dto.ApplicationId);
        if (application != null)
        {
            var screeningId = await GetApplicationStatusIdByCodeAsync("SCREENING");
            var interviewingId = await GetApplicationStatusIdByCodeAsync("INTERVIEWING");
            if (screeningId.HasValue && interviewingId.HasValue && application.StatusId == screeningId.Value)
            {
                var oldStatusId = application.StatusId;
                application.StatusId = interviewingId.Value;
                _context.StatusHistories.Add(new StatusHistory
                {
                    EntityTypeId = 3, // APPLICATION
                    EntityId = application.Id,
                    FromStatusId = oldStatusId,
                    ToStatusId = interviewingId.Value,
                    ChangedBy = userId,
                    ChangedAt = DateTimeHelper.Now,
                    Note = "Chuyển Đang phỏng vấn do đã xếp lịch phỏng vấn"
                });
                await _context.SaveChangesAsync();
            }
        }

        // Assign participants
        if (dto.Participants.Count > 0)
        {
            var participants = dto.Participants.Select(p => new InterviewParticipant
            {
                InterviewId = interview.Id,
                UserId = p.UserId,
                InterviewRoleId = p.InterviewRoleId
            }).ToList();

            _context.InterviewParticipants.AddRange(participants);
            await _context.SaveChangesAsync();
        }

        // Log conflict override to StatusHistory if needed
        if (conflictResult.HasConflicts && dto.IgnoreConflicts)
        {
            _context.StatusHistories.Add(new StatusHistory
            {
                EntityTypeId = 4, // INTERVIEW
                EntityId = interview.Id,
                FromStatusId = null,
                ToStatusId = scheduledId,
                ChangedBy = userId,
                ChangedAt = DateTimeHelper.Now,
                Note = $"Interview created with conflicts (override). Conflicts: {conflictWarning}. Reason: {dto.ConflictOverrideReason ?? "N/A"}"
            });
            await _context.SaveChangesAsync();
        }

        return (interview.Id, conflictWarning);
    }

    public async Task<bool> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto)
    {
        var interview = await _context.Interviews
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.IsDeleted == false);
        if (interview == null) return false;

        bool isRescheduled = false;
        var oldStartTime = interview.StartTime;
        var oldEndTime = interview.EndTime;

        if (dto.StartTime.HasValue) 
        {
            interview.StartTime = dto.StartTime.Value;
            isRescheduled = true;
        }
        
        if (dto.EndTime.HasValue)
        {
            interview.EndTime = dto.EndTime.Value;
            isRescheduled = true;
        }
        
        if (dto.Location != null) interview.Location = dto.Location;
        if (dto.MeetingLink != null) interview.MeetingLink = dto.MeetingLink;

        // Track reschedule
        if (isRescheduled)
        {
            interview.RescheduledCount++;
            interview.UpdatedAt = DateTimeHelper.Now;

            // Change status to RESCHEDULED if currently SCHEDULED or CONFIRMED
            if (interview.Status.Code is "SCHEDULED" or "CONFIRMED")
            {
                var rescheduledStatusId = await GetStatusIdAsync("RESCHEDULED");
                var oldStatusId = interview.StatusId;
                interview.StatusId = rescheduledStatusId;

                // Log to StatusHistory
                _context.StatusHistories.Add(new StatusHistory
                {
                    EntityTypeId = 4, // INTERVIEW
                    EntityId = interviewId,
                    FromStatusId = oldStatusId,
                    ToStatusId = rescheduledStatusId,
                    ChangedBy = interview.UpdatedBy ?? interview.CreatedBy,
                    ChangedAt = DateTimeHelper.Now,
                    Note = $"Reschedule từ {oldStartTime:dd/MM HH:mm}-{oldEndTime:HH:mm} sang {interview.StartTime:dd/MM HH:mm}-{interview.EndTime:HH:mm}"
                });
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> FinalizeInterviewAsync(int interviewId, string decision, string? note, int userId)
    {
        var interview = await _context.Interviews
            .Include(i => i.Application)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.IsDeleted == false);

        if (interview == null) return false;

        interview.StatusId = await GetStatusIdAsync("COMPLETED");

        var newAppStatusId = await GetStatusIdAsync(decision.ToUpper() == "PASS" ? "PASSED" : "REJECTED");
        var oldAppStatusId = interview.Application.StatusId;

        interview.Application.StatusId  = newAppStatusId;
        interview.Application.UpdatedAt = DateTimeHelper.Now;
        interview.Application.UpdatedBy = userId;

        _context.StatusHistories.Add(new StatusHistory
        {
            EntityTypeId = 3, // APPLICATION
            EntityId     = interview.ApplicationId,
            FromStatusId = oldAppStatusId,
            ToStatusId   = newAppStatusId,
            ChangedBy    = userId,
            ChangedAt    = DateTimeHelper.Now,
            Note         = note
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelInterviewAsync(int interviewId, int userId)
    {
        var interview = await _context.Interviews.FindAsync(interviewId);
        if (interview == null || interview.IsDeleted == true) return false;

        interview.StatusId = await GetStatusIdAsync("CANCELLED");
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<EvaluationCriterion>> GetCriteriaByPositionAsync(int positionId, int roundNo)
    {
        return await EvaluationCriteriaQueryHelper.GetCriteriaByPositionAndRoundAsync(_context, positionId, roundNo);
    }

    public Task<bool> IsInterviewParticipantAsync(int interviewId, int userId)
        => _context.InterviewParticipants.AnyAsync(ip => ip.InterviewId == interviewId && ip.UserId == userId);

    public Task<bool> ParticipantHasConfirmedParticipationAsync(int interviewId, int userId)
        => _context.InterviewParticipants.AnyAsync(ip =>
            ip.InterviewId == interviewId &&
            ip.UserId == userId &&
            ip.ConfirmedAt.HasValue &&
            !ip.DeclinedAt.HasValue);

    public Task<bool> HasFeedbackAsync(int interviewId, int userId)
        => _context.InterviewFeedbacks.AnyAsync(f => f.InterviewId == interviewId && f.InterviewerId == userId);

    public async Task SetCandidateInvitationSentAtAsync(int interviewId, DateTime sentAt)
    {
        var interview = await _context.Interviews.FirstOrDefaultAsync(i => i.Id == interviewId && i.IsDeleted == false);
        if (interview != null)
        {
            interview.CandidateInvitationSentAt = sentAt;
            await _context.SaveChangesAsync();
        }
    }

    public async Task PrepareResendCandidateInvitationAsync(int interviewId, DateTime sentAt, int changedByUserId)
    {
        var interview = await _context.Interviews
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.IsDeleted == false);
        if (interview == null) return;

        var now = DateTimeHelper.Now;
        interview.CandidateInvitationSentAt = sentAt;

        // Khi HR xử lý lại case từ chối và gửi lại thư mời:
        // 1. Xóa ghi chú từ chối của ứng viên (CandidateDeclineNote)
        // 2. Reset trạng thái từ chối của toàn bộ interviewer (DeclinedAt/DeclineNote)
        if (interview.InterviewParticipants != null && interview.InterviewParticipants.Count > 0)
        {
            foreach (var participant in interview.InterviewParticipants.Where(p => p.DeclinedAt.HasValue))
            {
                participant.DeclinedAt = null;
                participant.DeclineNote = null;
            }
        }

        if (interview.Status?.Code == "DECLINED_BY_CANDIDATE")
        {
            interview.CandidateDeclineNote = null;
            var rescheduledStatusId = await GetStatusIdAsync("RESCHEDULED");
            var declinedStatusId = await GetStatusIdAsync("DECLINED_BY_CANDIDATE");
            interview.StatusId = rescheduledStatusId;

            _context.StatusHistories.Add(new StatusHistory
            {
                EntityTypeId = 4,
                EntityId = interviewId,
                FromStatusId = declinedStatusId,
                ToStatusId = rescheduledStatusId,
                ChangedBy = changedByUserId,
                ChangedAt = now,
                Note = "Gửi lại yêu cầu xác nhận tham gia cho ứng viên (đã đổi lịch)"
            });
        }
        else
        {
            _context.StatusHistories.Add(new StatusHistory
            {
                EntityTypeId = 4,
                EntityId = interviewId,
                FromStatusId = interview.StatusId,
                ToStatusId = interview.StatusId,
                ChangedBy = changedByUserId,
                ChangedAt = now,
                Note = "Gửi yêu cầu xác nhận tham gia cho ứng viên"
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<InterviewHistoryItemDto>> GetInterviewHistoryAsync(int interviewId)
    {
        const int entityTypeInterview = 4;
        var list = await _context.StatusHistories
            .Include(sh => sh.FromStatus)
            .Include(sh => sh.ToStatus)
            .Include(sh => sh.ChangedByNavigation)
            .Where(sh => sh.EntityTypeId == entityTypeInterview && sh.EntityId == interviewId)
            .OrderByDescending(sh => sh.ChangedAt)
            .Take(50)
            .Select(sh => new InterviewHistoryItemDto
            {
                At = sh.ChangedAt,
                FromStatusName = sh.FromStatus != null ? sh.FromStatus.Name : null,
                ToStatusName = sh.ToStatus.Name,
                Note = sh.Note,
                ChangedByName = sh.ChangedByNavigation.FullName
            })
            .ToListAsync();
        return list;
    }

    public async Task RemoveAllParticipantsAsync(int interviewId)
    {
        var participants = await _context.InterviewParticipants
            .Where(ip => ip.InterviewId == interviewId)
            .ToListAsync();
        _context.InterviewParticipants.RemoveRange(participants);
        await _context.SaveChangesAsync();
    }

    public async Task<int?> GetDeptManagerUserIdByInterviewIdAsync(int interviewId)
    {
        return await _context.Interviews
            .Where(i => i.Id == interviewId && i.IsDeleted == false)
            .Select(i => i.Application.JobRequest.Position.Department.HeadUserId)
            .FirstOrDefaultAsync();
    }

    // ---- Helpers ----

    private IQueryable<Interview> BuildInterviewQuery(int? scopeByStaffId = null)
    {
        IQueryable<Interview> query = _context.Interviews
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
            .Include(i => i.InterviewFeedbacks)
            .Include(i => i.Requests)
                .ThenInclude(r => r.Status)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Candidate)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department);

        // Khi hồ sơ bị REJECTED thì interview không còn hiển thị ở màn quản lý phỏng vấn.
        query = query.Where(i => i.Application != null && i.Application.StatusId != 13);

        if (scopeByStaffId.HasValue)
            query = query.Where(i => i.Application != null && i.Application.JobRequest != null && i.Application.JobRequest.AssignedStaffId == scopeByStaffId.Value);
        return query;
    }

    private static InterviewListDto ToListDto(Interview i)
    {
        var hasDecline = !string.IsNullOrWhiteSpace(i.CandidateDeclineNote)
            || (i.InterviewParticipants != null && i.InterviewParticipants.Any(p => p.DeclinedAt.HasValue));
        return new InterviewListDto
        {
            Id = i.Id,
            ApplicationId = i.ApplicationId,
            RoundNo = i.RoundNo,
            CandidateName = i.Application.Cvprofile.Candidate.FullName,
            PositionId = i.Application.JobRequest.Position.Id,
            PositionTitle = i.Application.JobRequest.Position.Title,
            DepartmentName = i.Application.JobRequest.Position.Department.Name,
            StartTime = i.StartTime,
            EndTime = i.EndTime,
            Location = i.Location ?? "",
            MeetingLink = i.MeetingLink,
            StatusCode = i.Status.Code,
            StatusName = i.Status.Name,
            ParticipantCount = i.InterviewParticipants?.Count ?? 0,
            FeedbackCount = i.InterviewFeedbacks?.Count ?? 0,
            OpenParticipantRequestCount = i.Requests?.Count(r => r.Status.Code == "PENDING" || r.Status.Code == "FORWARDED") ?? 0,
            FulfilledParticipantRequestCount = i.Requests?.Count(r => r.Status.Code == "FULFILLED") ?? 0,
            HasDeclineNote = hasDecline
        };
    }

    private static InterviewDetailDto ToDetailDto(Interview i)
    {
        var list = ToListDto(i);
        return new InterviewDetailDto
        {
            Id               = list.Id,
            ApplicationId    = list.ApplicationId,
            RoundNo          = list.RoundNo,
            CandidateName    = list.CandidateName,
            PositionTitle    = list.PositionTitle,
            DepartmentName   = list.DepartmentName,
            StartTime        = list.StartTime,
            EndTime          = list.EndTime,
            Location         = list.Location,
            MeetingLink      = list.MeetingLink,
            StatusCode       = list.StatusCode,
            StatusName       = list.StatusName,
            ParticipantCount = list.ParticipantCount,
            FeedbackCount    = list.FeedbackCount,
            OpenParticipantRequestCount = list.OpenParticipantRequestCount,
            FulfilledParticipantRequestCount = list.FulfilledParticipantRequestCount
        };
    }
}
