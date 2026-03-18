using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class HRInterviewsRepository : IHRInterviewsRepository
{
    private readonly RecruitmentDbContext _context;

    public HRInterviewsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    private async Task<int> GetStatusIdAsync(string code)
        => await _context.Statuses.Where(s => s.Code == code).Select(s => s.Id).FirstAsync();

    public async Task<List<InterviewListDto>> GetInterviewsAsync()
    {
        return await BuildInterviewQuery()
            .Where(i => i.IsDeleted == false)
            .OrderByDescending(i => i.StartTime)
            .Select(i => ToListDto(i))
            .ToListAsync();
    }

    public async Task<List<InterviewListDto>> GetUpcomingInterviewsAsync()
    {
        return await BuildInterviewQuery()
            .Where(i => i.IsDeleted == false && i.StartTime > DateTimeHelper.Now)
            .OrderBy(i => i.StartTime)
            .Select(i => ToListDto(i))
            .ToListAsync();
    }

    public async Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId)
    {
        var i = await BuildInterviewQuery()
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
        dto.Participants = i.InterviewParticipants.Select(p => new InterviewParticipantItemDto
        {
            UserId = p.UserId,
            UserName = p.User.FullName,
            Email = p.User.Email,
            InterviewRoleCode = p.InterviewRole?.Code ?? "",
            InterviewRoleName = p.InterviewRole?.Name ?? "",
            HasSubmittedFeedback = submittedIds.Contains(p.UserId)
        }).ToList();

        dto.Feedbacks = i.InterviewFeedbacks.Select(f => new InterviewFeedbackItemDto
        {
            Id = f.Id,
            InterviewerId = f.InterviewerId,
            InterviewerName = f.Interviewer.FullName,
            Note = f.Note,
            CreatedAt = f.CreatedAt,
            Scores = f.InterviewScores.Select(s => new InterviewScoreItemDto
            {
                CriteriaName = s.Criteria.Name,
                Weight = s.Criteria.Weight,
                Score = s.Score
            }).ToList()
        }).ToList();

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

        // Conflict check: candidate có interview nào trùng giờ không?
        var candidateId = await _context.Applications
            .Where(a => a.Id == dto.ApplicationId)
            .Select(a => a.Cvprofile.CandidateId)
            .FirstOrDefaultAsync();

        string? conflictWarning = null;
        if (candidateId > 0)
        {
            var hasConflict = await _context.Interviews
                .AnyAsync(i =>
                    i.Application.Cvprofile.CandidateId == candidateId &&
                    i.IsDeleted == false &&
                    i.Status.Code != "CANCELLED" &&
                    i.Status.Code != "COMPLETED" &&
                    i.Status.Code != "DECLINED_BY_CANDIDATE" &&
                    i.StartTime < dto.EndTime &&
                    i.EndTime > dto.StartTime);

            if (hasConflict)
                conflictWarning = "Candidate đã có lịch phỏng vấn trùng thời gian này.";
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
            IsDeleted = false
        };

        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

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

        return (interview.Id, conflictWarning);
    }

    public async Task<bool> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto)
    {
        var interview = await _context.Interviews
            .Include(i => i.Status)
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.IsDeleted == false);
        if (interview == null) return false;

        if (dto.StartTime.HasValue) interview.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue)   interview.EndTime   = dto.EndTime.Value;
        if (dto.Location != null)   interview.Location  = dto.Location;
        if (dto.MeetingLink != null) interview.MeetingLink = dto.MeetingLink;

        // Dời lịch → RESCHEDULED (chỉ khi đang SCHEDULED hoặc CONFIRMED)
        if (dto.StartTime.HasValue &&
            (interview.Status.Code is "SCHEDULED" or "CONFIRMED"))
        {
            interview.StatusId = await GetStatusIdAsync("RESCHEDULED");
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

    public async Task<List<EvaluationCriterion>> GetCriteriaByPositionAsync(int positionId)
    {
        // Lấy criteria từ template gắn với position, fallback về template không gắn position
        var criteria = await _context.EvaluationCriteria
            .Include(c => c.Template)
            .Where(c => c.Template.PositionId == positionId)
            .ToListAsync();

        if (criteria.Count == 0)
        {
            // Fallback: template chung (không gắn position)
            criteria = await _context.EvaluationCriteria
                .Include(c => c.Template)
                .Where(c => c.Template.PositionId == null)
                .ToListAsync();
        }

        return criteria;
    }

    // ---- Helpers ----

    private IQueryable<Interview> BuildInterviewQuery()
    {
        return _context.Interviews
            .Include(i => i.Status)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Candidate)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department);
    }

    private static InterviewListDto ToListDto(Interview i) => new()
    {
        Id               = i.Id,
        ApplicationId    = i.ApplicationId,
        RoundNo          = i.RoundNo,
        CandidateName    = i.Application.Cvprofile.Candidate.FullName,
        PositionTitle    = i.Application.JobRequest.Position.Title,
        DepartmentName   = i.Application.JobRequest.Position.Department.Name,
        StartTime        = i.StartTime,
        EndTime          = i.EndTime,
        Location         = i.Location ?? "",
        MeetingLink      = i.MeetingLink,
        StatusCode       = i.Status.Code,
        StatusName       = i.Status.Name,
        ParticipantCount = i.InterviewParticipants.Count,
        FeedbackCount    = i.InterviewFeedbacks.Count
    };

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
            FeedbackCount    = list.FeedbackCount
        };
    }
}
