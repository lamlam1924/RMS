using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Service.Interface;

namespace RMS.Service;

/// <summary>
/// SIMPLIFIED: No NoShowLogs table - uses StatusHistory + Applications.NoShowCount
/// </summary>
public class InterviewNoShowService : IInterviewNoShowService
{
    private readonly RecruitmentDbContext _context;
    private const int BLACKLIST_THRESHOLD = 3; // 3 no-shows = blacklisted
    private const string CandidateNoShowCode = "NO_SHOW";
    private const string InterviewerAbsentCode = "INTERVIEWER_ABSENT";

    public InterviewNoShowService(RecruitmentDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Mark interview as no-show (candidate or interviewer)
    /// Uses StatusHistory for logging, no separate NoShowLogs table
    /// </summary>
    public async Task<bool> MarkAsNoShowAsync(MarkNoShowRequestDto request, int markedBy)
    {
        if (string.IsNullOrWhiteSpace(request.NoShowType))
            throw new Exception("NoShowType is required");

        var normalizedNoShowType = request.NoShowType.Trim().ToUpperInvariant();

        var interview = await _context.Interviews
            .Include(i => i.Application)
            .ThenInclude(a => a!.Cvprofile)
            .ThenInclude(cv => cv!.Candidate)
            .Include(i => i.InterviewParticipants)
            .FirstOrDefaultAsync(i => i.Id == request.InterviewId);

        if (interview == null)
            throw new Exception($"Interview {request.InterviewId} not found");

        var noShowStatus = await _context.Statuses.FirstOrDefaultAsync(s => s.Code == CandidateNoShowCode);
        if (noShowStatus == null)
            throw new Exception("NO_SHOW status not found in database");

        var interviewerAbsentStatus = await _context.Statuses.FirstOrDefaultAsync(s => s.Code == InterviewerAbsentCode);

        var targetStatus = normalizedNoShowType == "INTERVIEWER"
            ? interviewerAbsentStatus ?? noShowStatus
            : noShowStatus;

        if (interview.StatusId == targetStatus.Id)
            throw new Exception("Interview has already been marked with this no-show status");

        var oldStatusId = interview.StatusId;

        interview.StatusId = targetStatus.Id;

        // Build structured note for StatusHistory
        var noteText = $"NO_SHOW|Type:{normalizedNoShowType}";

        if (normalizedNoShowType == "CANDIDATE")
        {
            var candidateId = interview.Application?.Cvprofile?.CandidateId;
            if (candidateId == null)
                throw new Exception("Cannot determine candidate ID from interview");

            noteText += $"|CandidateId:{candidateId}";

            // Increment no-show count on application
            if (interview.Application != null)
            {
                interview.Application.NoShowCount += 1;
            }
        }
        else if (normalizedNoShowType == "INTERVIEWER")
        {
            if (request.UserId == null)
                throw new Exception("UserId is required for INTERVIEWER no-show");

            var isParticipant = interview.InterviewParticipants.Any(ip => ip.UserId == request.UserId.Value);
            if (!isParticipant)
                throw new Exception("The specified interviewer is not assigned to this interview");

            noteText += $"|UserId:{request.UserId}";
        }
        else
        {
            throw new Exception($"Invalid NoShowType: {request.NoShowType}. Must be CANDIDATE or INTERVIEWER");
        }

        if (!string.IsNullOrEmpty(request.Reason))
            noteText += $"|Reason:{request.Reason}";

        // Log to StatusHistory (no separate NoShowLogs table)
        var statusHistory = new StatusHistory
        {
            EntityTypeId = 4, // INTERVIEW
            EntityId = request.InterviewId,
            FromStatusId = oldStatusId,
            ToStatusId = targetStatus.Id,
            ChangedBy = markedBy,
            ChangedAt = DateTime.Now,
            Note = noteText
        };

        _context.StatusHistories.Add(statusHistory);

        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// Get no-show statistics for a specific candidate (from Applications.NoShowCount)
    /// </summary>
    public async Task<CandidateNoShowStatsDto?> GetCandidateNoShowStatsAsync(int candidateId)
    {
        var candidate = await _context.Candidates.FindAsync(candidateId);
        if (candidate == null)
            return null;

        // Get applications with no-shows
        var applications = await _context.Applications
            .Include(a => a.Cvprofile)
            .Where(a => a.Cvprofile!.CandidateId == candidateId && a.NoShowCount > 0)
            .ToListAsync();

        var totalNoShows = applications.Sum(a => a.NoShowCount);

        // Get last no-show date from StatusHistory
        var lastNoShowDate = await _context.StatusHistories
            .Where(sh => sh.EntityTypeId == 4 && sh.Note!.Contains("NO_SHOW|Type:CANDIDATE"))
            .Join(_context.Interviews,
                sh => sh.EntityId,
                i => i.Id,
                (sh, i) => new { sh, i })
            .Where(x => x.i.Application!.Cvprofile!.CandidateId == candidateId)
            .OrderByDescending(x => x.sh.ChangedAt)
            .Select(x => x.sh.ChangedAt)
            .FirstOrDefaultAsync();

        return new CandidateNoShowStatsDto
        {
            CandidateId = candidateId,
            CandidateName = candidate.FullName,
            CandidateEmail = candidate.Email,
            TotalNoShows = totalNoShows,
            LastNoShowDate = lastNoShowDate == default ? null : lastNoShowDate,
            IsBlacklisted = totalNoShows >= BLACKLIST_THRESHOLD
        };
    }

    /// <summary>
    /// Get overall no-show statistics summary (simplified)
    /// </summary>
    public async Task<NoShowStatisticsSummaryDto> GetNoShowStatisticsSummaryAsync()
    {
        var noShowStatusIds = await _context.Statuses
            .Where(s => s.Code == CandidateNoShowCode || s.Code == InterviewerAbsentCode)
            .Select(s => s.Id)
            .ToListAsync();

        if (noShowStatusIds.Count == 0)
        {
            return new NoShowStatisticsSummaryDto();
        }

        var noShowHistory = await _context.StatusHistories
            .Where(sh => sh.EntityTypeId == 4 && noShowStatusIds.Contains(sh.ToStatusId))
            .ToListAsync();

        var totalNoShows = noShowHistory.Count;
        var candidateNoShows = noShowHistory.Count(sh => sh.Note != null && sh.Note.Contains("Type:CANDIDATE"));
        var interviewerNoShows = noShowHistory.Count(sh => sh.Note != null && sh.Note.Contains("Type:INTERVIEWER"));

        // Group by month
        var byMonth = noShowHistory
            .Where(sh => sh.ChangedAt.HasValue)
            .GroupBy(sh => new { sh.ChangedAt!.Value.Year, sh.ChangedAt.Value.Month })
            .Select(g => new MonthlyNoShowDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count()
            })
            .OrderByDescending(m => m.Year).ThenByDescending(m => m.Month)
            .ToList();

        // Top offenders from Applications.NoShowCount
        var topOffenders = await _context.Applications
            .Include(a => a.Cvprofile)
            .ThenInclude(cv => cv!.Candidate)
            .Where(a => a.NoShowCount > 0)
            .GroupBy(a => a.Cvprofile!.CandidateId)
            .Select(g => new
            {
                CandidateId = g.Key,
                TotalNoShows = g.Sum(a => a.NoShowCount),
                Candidate = g.First().Cvprofile!.Candidate
            })
            .OrderByDescending(x => x.TotalNoShows)
            .Take(10)
            .ToListAsync();

        var topOffenderDtos = topOffenders.Select(o => new CandidateNoShowStatsDto
        {
            CandidateId = o.CandidateId,
            CandidateName = o.Candidate!.FullName,
            CandidateEmail = o.Candidate.Email,
            TotalNoShows = o.TotalNoShows,
            LastNoShowDate = null, // Simplified - không query detail
            IsBlacklisted = o.TotalNoShows >= BLACKLIST_THRESHOLD
        }).ToList();

        return new NoShowStatisticsSummaryDto
        {
            TotalNoShows = totalNoShows,
            CandidateNoShows = candidateNoShows,
            InterviewerNoShows = interviewerNoShows,
            ByMonth = byMonth,
            TopOffenders = topOffenderDtos
        };
    }

    /// <summary>
    /// Check if candidate is blacklisted due to no-shows
    /// </summary>
    public async Task<bool> IsCandidateBlacklistedAsync(int candidateId)
    {
        var totalNoShows = await _context.Applications
            .Where(a => a.Cvprofile!.CandidateId == candidateId)
                .SumAsync(a => a.NoShowCount);

        return totalNoShows >= BLACKLIST_THRESHOLD;
    }
}
