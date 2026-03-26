using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.DepartmentManager;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class DeptManagerInterviewsRepository : IDeptManagerInterviewsRepository
{
    private readonly RecruitmentDbContext _context;

    /// <summary>Matches ParticipantRequestRepository nomination log (EntityType INTERVIEW).</summary>
    private const int EntityTypeInterview = 4;
    private const string NominationHistoryType = "NOMINATION_PARTICIPANTS";

    public DeptManagerInterviewsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<Interview>> GetInterviewsByManagerIdAsync(int managerId)
    {
        return await _context.InterviewParticipants
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Application)
                    .ThenInclude(a => a.Cvprofile)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Application)
                    .ThenInclude(a => a.JobRequest)
                        .ThenInclude(jr => jr.Position)
                            .ThenInclude(p => p.Department)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Status)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.InterviewParticipants)
                    .ThenInclude(p => p.User)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.InterviewParticipants)
                    .ThenInclude(p => p.InterviewRole)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.InterviewFeedbacks)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Requests)
            .Where(ip => ip.UserId == managerId && !ip.Interview.IsDeleted!.Value)
            .Select(ip => ip.Interview)
            .Distinct()
            .OrderByDescending(i => i.StartTime)
            .ToListAsync();
    }

    public async Task<List<Interview>> GetUpcomingInterviewsByManagerIdAsync(int managerId)
    {
        var now = DateTimeHelper.Now;
        return await _context.InterviewParticipants
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Application)
                    .ThenInclude(a => a.Cvprofile)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Application)
                    .ThenInclude(a => a.JobRequest)
                        .ThenInclude(jr => jr.Position)
                            .ThenInclude(p => p.Department)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Status)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.InterviewParticipants)
                    .ThenInclude(p => p.User)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.InterviewParticipants)
                    .ThenInclude(p => p.InterviewRole)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.InterviewFeedbacks)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Requests)
            .Where(ip => ip.UserId == managerId && 
                         ip.Interview.StartTime > now &&
                         !ip.Interview.IsDeleted!.Value)
            .Select(ip => ip.Interview)
            .Distinct()
            .OrderBy(i => i.StartTime)
            .Take(10)
            .ToListAsync();
    }

    public async Task<List<int>> GetInterviewIdsNominatedByManagerAsync(int managerId)
    {
        return await _context.StatusHistories
            .AsNoTracking()
            .Where(h => h.EntityTypeId == EntityTypeInterview
                        && h.ChangedBy == managerId
                        && h.Note != null
                        && h.Note.Contains(NominationHistoryType))
            .Select(h => h.EntityId)
            .Distinct()
            .ToListAsync();
    }

    public Task<bool> HasNominatedForInterviewAsync(int interviewId, int managerId)
        => _context.StatusHistories
            .AsNoTracking()
            .AnyAsync(h => h.EntityTypeId == EntityTypeInterview
                           && h.EntityId == interviewId
                           && h.ChangedBy == managerId
                           && h.Note != null
                           && h.Note.Contains(NominationHistoryType));

    private IQueryable<Interview> InterviewDetailGraph()
        => _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Cvexperiences)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Cveducations)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Cvcertificates)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(p => p.User)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(p => p.InterviewRole)
            .Include(i => i.InterviewFeedbacks)
            .Include(i => i.Requests);

    public async Task<List<Interview>> GetInterviewsByIdsAsync(List<int> interviewIds)
    {
        if (interviewIds == null || interviewIds.Count == 0)
            return new List<Interview>();

        var ids = interviewIds.Distinct().ToList();
        return await InterviewDetailGraph()
            .Where(i => ids.Contains(i.Id) && !i.IsDeleted!.Value)
            .OrderByDescending(i => i.StartTime)
            .ToListAsync();
    }

    public async Task<Interview?> GetInterviewByIdAsync(int id, int managerId)
    {
        var interview = await InterviewDetailGraph()
            .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted!.Value);
        if (interview == null) return null;

        var isParticipant = interview.InterviewParticipants.Any(p => p.UserId == managerId);
        if (isParticipant) return interview;

        if (await HasNominatedForInterviewAsync(id, managerId))
            return interview;

        return null;
    }

    public async Task<bool> IsInterviewParticipantAsync(int interviewId, int managerId)
    {
        return await _context.InterviewParticipants
            .AnyAsync(ip => ip.InterviewId == interviewId && ip.UserId == managerId);
    }

    public Task<bool> ParticipantHasConfirmedParticipationAsync(int interviewId, int userId)
        => _context.InterviewParticipants.AnyAsync(ip =>
            ip.InterviewId == interviewId &&
            ip.UserId == userId &&
            ip.ConfirmedAt.HasValue &&
            !ip.DeclinedAt.HasValue);

    public async Task<bool> RespondToParticipationAsync(int interviewId, int userId, bool confirm, string? declineNote = null)
    {
        var participant = await _context.InterviewParticipants
            .FirstOrDefaultAsync(ip => ip.InterviewId == interviewId && ip.UserId == userId);
        if (participant == null) return false;

        var now = DateTimeHelper.Now;
        if (confirm)
        {
            participant.ConfirmedAt = now;
            participant.DeclinedAt = null;
            participant.DeclineNote = null;
        }
        else
        {
            participant.DeclinedAt = now;
            participant.ConfirmedAt = null;
            participant.DeclineNote = string.IsNullOrWhiteSpace(declineNote) ? null : declineNote.Trim().Length > 500 ? declineNote.Trim().Substring(0, 500) : declineNote.Trim();
        }
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<InterviewFeedback?> GetFeedbackByInterviewerAsync(int interviewId, int interviewerId)
    {
        return await _context.InterviewFeedbacks
            .FirstOrDefaultAsync(f => f.InterviewId == interviewId && 
                                     f.InterviewerId == interviewerId);
    }

    public async Task<InterviewFeedback> CreateFeedbackAsync(InterviewFeedback feedback)
    {
        _context.InterviewFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();
        return feedback;
    }

    public async Task<bool> AddInterviewScoresAsync(List<InterviewScore> scores)
    {
        _context.InterviewScores.AddRange(scores);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateApplicationStatusAsync(
        int applicationId, int statusId, int updatedBy, string? comment)
    {
        var application = await _context.Applications.FindAsync(applicationId);
        if (application == null) return false;

        var oldStatusId = application.StatusId;
        application.StatusId = statusId;
        application.UpdatedAt = DateTimeHelper.Now;
        application.UpdatedBy = updatedBy;

        // Add status history
        _context.StatusHistories.Add(new StatusHistory
        {
            EntityTypeId = 3, // Application
            EntityId = applicationId,
            FromStatusId = oldStatusId,
            ToStatusId = statusId,
            ChangedBy = updatedBy,
            ChangedAt = DateTimeHelper.Now,
            Note = comment
        });

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<EvaluationCriterion>> GetEvaluationCriteriaByPositionAsync(int positionId, int roundNo)
    {
        return await EvaluationCriteriaQueryHelper.GetCriteriaByPositionAndRoundAsync(_context, positionId, roundNo);
    }

    public async Task<List<PreviousRoundSummaryDto>> GetPreviousRoundsAsync(int applicationId, int currentRoundNo)
    {
        return await _context.Interviews
            .Include(i => i.Status)
            .Include(i => i.InterviewRoundDecision)
            .Where(i => i.ApplicationId == applicationId
                        && i.RoundNo < currentRoundNo
                        && i.IsDeleted == false)
            .OrderBy(i => i.RoundNo)
            .Select(i => new PreviousRoundSummaryDto
            {
                RoundNo = i.RoundNo,
                InterviewId = i.Id,
                StartTime = i.StartTime,
                StatusCode = i.Status.Code,
                StatusName = i.Status.Name,
                AverageScore = i.InterviewFeedbacks.Any(f => f.InterviewScores.Any())
                    ? (decimal?)i.InterviewFeedbacks
                        .SelectMany(f => f.InterviewScores)
                        .Average(s => s.Score)
                    : null,
                DecisionCode = i.InterviewRoundDecision != null ? i.InterviewRoundDecision.DecisionCode : null,
                DecisionNote = i.InterviewRoundDecision != null ? i.InterviewRoundDecision.Note : null
            })
            .ToListAsync();
    }
}
