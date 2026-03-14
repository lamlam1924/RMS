using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RMS.Common;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Service.Interface;

namespace RMS.Service;

public class InterviewMultiRoundService : IInterviewMultiRoundService
{
    private readonly RecruitmentDbContext _context;
    private readonly IInterviewConflictService _conflictService;
    private readonly IInterviewRoundSummaryService _roundSummaryService;
    private readonly IInterviewEmailService _emailService;
    private readonly IConfiguration _configuration;
    private const int FEEDBACK_DEADLINE_DAYS = 3;

    public InterviewMultiRoundService(
        RecruitmentDbContext context,
        IInterviewConflictService conflictService,
        IInterviewRoundSummaryService roundSummaryService,
        IInterviewEmailService emailService,
        IConfiguration configuration)
    {
        _context = context;
        _conflictService = conflictService;
        _roundSummaryService = roundSummaryService;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<NextRoundCheckResultDto> CheckNextRoundEligibilityAsync(int interviewId)
    {
        var interview = await _context.Interviews
            .Include(i => i.InterviewParticipants)
            .FirstOrDefaultAsync(i => i.Id == interviewId);

        if (interview == null)
            throw new Exception($"Interview {interviewId} not found");

        var summary = await _roundSummaryService.BuildSummaryAsync(interviewId);
        var allFeedbackSubmitted = summary.TotalInterviewers == summary.SubmittedFeedbacks;
        var roundDecision = await BuildRoundDecisionDtoAsync(interviewId);

        var result = new NextRoundCheckResultDto
        {
            ShouldScheduleNextRound = false,
            ApplicationId = interview.ApplicationId,
            NextRoundNo = interview.RoundNo + 1,
            AverageScore = summary.AverageScore,
            AllFeedbackSubmitted = allFeedbackSubmitted,
            TotalInterviewers = summary.TotalInterviewers,
            SubmittedFeedbacks = summary.SubmittedFeedbacks,
            CanReviewRound = allFeedbackSubmitted,
            HasDecision = roundDecision != null,
            RoundDecision = roundDecision,
            RecommendationSummary = summary.RecommendationSummary,
            Message = string.Empty
        };

        if (!allFeedbackSubmitted)
        {
            result.Message = $"Waiting for {summary.TotalInterviewers - summary.SubmittedFeedbacks} more feedback(s)";
            return result;
        }

        if (roundDecision == null)
        {
            result.Message = $"All feedback submitted for round {interview.RoundNo}. Waiting for HR decision";
            return result;
        }

        result.ShouldScheduleNextRound = InterviewWorkflowHelper.IsPassDecision(roundDecision.DecisionCode);
        result.Message = roundDecision.DecisionCode switch
        {
            InterviewWorkflowHelper.RoundDecisionPass =>
                $"Round {interview.RoundNo} was approved. Candidate is ready for the next round",
            InterviewWorkflowHelper.RoundDecisionFail =>
                $"Round {interview.RoundNo} was marked as FAIL",
            InterviewWorkflowHelper.RoundDecisionHold =>
                $"Round {interview.RoundNo} is on hold pending further review",
            InterviewWorkflowHelper.RoundDecisionExtraRound =>
                $"Round {interview.RoundNo} requires an additional interview round",
            _ => "Round decision has been recorded"
        };

        return result;
    }

    public async Task<InterviewRoundProgressDto> GetRoundProgressAsync(int applicationId)
    {
        var application = await _context.Applications
            .Include(a => a.Cvprofile)
            .ThenInclude(cv => cv!.Candidate)
            .Include(a => a.JobRequest)
            .ThenInclude(jr => jr!.JobPostings)
            .FirstOrDefaultAsync(a => a.Id == applicationId);

        if (application == null)
            throw new Exception($"Application {applicationId} not found");

        var interviews = await _context.Interviews
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
            .ThenInclude(ip => ip.User)
            .Where(i => i.ApplicationId == applicationId)
            .OrderBy(i => i.RoundNo)
            .ToListAsync();

        var rounds = new List<RoundDetailDto>();

        foreach (var interview in interviews)
        {
            var summary = await _roundSummaryService.BuildSummaryAsync(interview.Id);
            var roundDecision = await BuildRoundDecisionDtoAsync(interview.Id);

            rounds.Add(new RoundDetailDto
            {
                RoundNo = interview.RoundNo,
                InterviewId = interview.Id,
                StartTime = interview.StartTime,
                EndTime = interview.EndTime,
                Status = interview.Status?.Name ?? "Unknown",
                AverageScore = summary.AverageScore,
                AllFeedbackSubmitted = summary.TotalInterviewers == summary.SubmittedFeedbacks,
                IsNextRoundScheduled = interview.IsNextRoundScheduled,
                RoundDecision = roundDecision,
                RecommendationSummary = summary.RecommendationSummary,
                InterviewerNames = interview.InterviewParticipants
                    .Select(ip => ip.User?.FullName ?? "Unknown")
                    .ToList()
            });
        }

        var currentRound = interviews.OrderByDescending(i => i.RoundNo).FirstOrDefault()?.RoundNo ?? 0;
        var completedRounds = rounds.Count(r => r.AllFeedbackSubmitted);

        return new InterviewRoundProgressDto
        {
            ApplicationId = applicationId,
            CandidateName = application.Cvprofile?.Candidate?.FullName ?? "Unknown",
            JobTitle = application.JobRequest?.JobPostings.FirstOrDefault()?.Title ?? "Unknown",
            CurrentRound = currentRound,
            TotalRoundsCompleted = completedRounds,
            Rounds = rounds
        };
    }

    public async Task<List<PendingFeedbackDto>> GetPendingFeedbacksAsync(int? interviewerId = null, bool overdueOnly = false)
    {
        var completedStatusIds = await _context.Statuses
            .Where(s => s.Code == "COMPLETED" || s.Code == "COMPLETED_PENDING_FEEDBACK")
            .Select(s => s.Id)
            .ToListAsync();

        var query = _context.InterviewParticipants
            .Include(ip => ip.Interview)
            .Include(ip => ip.User)
            .Where(ip => completedStatusIds.Contains(ip.Interview.StatusId))
            .AsQueryable();

        if (interviewerId.HasValue)
            query = query.Where(ip => ip.UserId == interviewerId);

        var participants = await query.ToListAsync();
        var pendingList = new List<PendingFeedbackDto>();

        foreach (var participant in participants)
        {
            var hasFeedback = await _context.InterviewFeedbacks
                .AnyAsync(f => f.InterviewId == participant.InterviewId && f.InterviewerId == participant.UserId);

            if (hasFeedback)
                continue;

            var daysSinceInterview = (DateTime.Now - participant.Interview.EndTime).Days;
            var requiresFeedbackBy = participant.Interview.RequiresFeedbackBy ?? participant.Interview.EndTime.AddDays(FEEDBACK_DEADLINE_DAYS);
            var isOverdue = DateTime.Now > requiresFeedbackBy;

            if (overdueOnly && !isOverdue)
                continue;

            pendingList.Add(new PendingFeedbackDto
            {
                InterviewId = participant.InterviewId,
                InterviewTitle = $"Interview Round {participant.Interview.RoundNo}",
                InterviewDate = participant.Interview.StartTime,
                RequiresFeedbackBy = requiresFeedbackBy,
                IsOverdue = isOverdue,
                InterviewerId = participant.UserId,
                InterviewerName = participant.User?.FullName ?? "Unknown",
                InterviewerEmail = participant.User?.Email ?? string.Empty,
                DaysSinceInterview = daysSinceInterview
            });
        }

        return pendingList.OrderByDescending(p => p.IsOverdue).ThenBy(p => p.RequiresFeedbackBy).ToList();
    }

    public async Task<bool> SendFeedbackReminderAsync(int interviewId)
    {
        var interview = await _context.Interviews
            .Include(i => i.InterviewParticipants)
                .ThenInclude(ip => ip.User)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Candidate)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
            .FirstOrDefaultAsync(i => i.Id == interviewId);

        if (interview == null)
            return false;

        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://rms.com";
        var deadline = interview.RequiresFeedbackBy ?? interview.EndTime.AddDays(FEEDBACK_DEADLINE_DAYS);
        var isOverdue = DateTime.Now > deadline;

        var candidateName = interview.Application?.Cvprofile?.Candidate?.FullName ?? "N/A";
        var positionTitle = interview.Application?.JobRequest?.Position?.Title ?? "N/A";

        // Gửi email cho từng interviewer chưa nộp feedback
        var submittedInterviewerIds = await _context.InterviewFeedbacks
            .Where(f => f.InterviewId == interviewId)
            .Select(f => f.InterviewerId)
            .ToListAsync();

        foreach (var participant in interview.InterviewParticipants)
        {
            if (submittedInterviewerIds.Contains(participant.UserId))
                continue;

            if (participant.User?.Email == null)
                continue;

            await _emailService.SendFeedbackReminderAsync(new FeedbackReminderEmailData
            {
                InterviewerEmail = participant.User.Email,
                InterviewerName = participant.User.FullName,
                CandidateName = candidateName,
                PositionTitle = positionTitle,
                InterviewDate = interview.StartTime,
                FeedbackDeadline = deadline,
                SubmitFeedbackLink = $"{baseUrl}/interviewer/interviews/{interviewId}/feedback",
                IsOverdue = isOverdue
            });
        }

        interview.FeedbackReminderSent = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<InterviewRoundDecisionDto> ReviewRoundAsync(
        int interviewId,
        ReviewInterviewRoundRequestDto request,
        int decidedBy)
    {
        var interview = await _context.Interviews
            .FirstOrDefaultAsync(i => i.Id == interviewId && i.IsDeleted == false);
        if (interview == null)
            throw new Exception($"Interview {interviewId} not found");

        var summary = await _roundSummaryService.BuildSummaryAsync(interviewId);
        if (summary.TotalInterviewers != summary.SubmittedFeedbacks)
        {
            throw new Exception(
                $"Cannot review round before all feedback is submitted. Missing {summary.TotalInterviewers - summary.SubmittedFeedbacks} feedback(s)");
        }

        var normalizedDecision = InterviewWorkflowHelper.NormalizeRoundDecision(request.Decision);

        var roundDecision = await _context.InterviewRoundDecisions
            .FirstOrDefaultAsync(d => d.InterviewId == interviewId);

        if (roundDecision == null)
        {
            roundDecision = new InterviewRoundDecision
            {
                InterviewId = interviewId,
                DecisionCode = normalizedDecision,
                Note = request.Note,
                DecidedBy = decidedBy,
                DecidedAt = DateTime.Now
            };

            _context.InterviewRoundDecisions.Add(roundDecision);
        }
        else
        {
            roundDecision.DecisionCode = normalizedDecision;
            roundDecision.Note = request.Note;
            roundDecision.DecidedBy = decidedBy;
            roundDecision.DecidedAt = DateTime.Now;
        }

        _context.StatusHistories.Add(new StatusHistory
        {
            EntityTypeId = 4,
            EntityId = interviewId,
            FromStatusId = interview.StatusId,
            ToStatusId = interview.StatusId,
            ChangedBy = decidedBy,
            ChangedAt = DateTime.Now,
            Note = $"ROUND_DECISION|Decision:{normalizedDecision}|AverageScore:{summary.AverageScore?.ToString("F2") ?? "N/A"}|Note:{request.Note ?? string.Empty}"
        });

        await _context.SaveChangesAsync();

        return await BuildRoundDecisionDtoAsync(interviewId)
               ?? throw new Exception("Failed to load round decision after saving");
    }

    public async Task<int> AutoScheduleNextRoundAsync(int previousInterviewId, ScheduleNextRoundRequestDto request, int createdBy)
    {
        if (request.EndTime <= request.StartTime)
            throw new Exception("EndTime must be greater than StartTime");

        if (request.InterviewerIds == null || request.InterviewerIds.Count == 0)
            throw new Exception("At least one interviewer is required for the next round");

        var distinctInterviewerIds = request.InterviewerIds.Distinct().ToList();

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var previousInterview = await _context.Interviews
            .FirstOrDefaultAsync(i => i.Id == previousInterviewId);
        if (previousInterview == null)
            throw new Exception($"Previous interview {previousInterviewId} not found");

        if (previousInterview.IsNextRoundScheduled)
            throw new Exception("Next round has already been scheduled for this interview");

        var checkResult = await CheckNextRoundEligibilityAsync(previousInterviewId);
        if (!checkResult.ShouldScheduleNextRound)
            throw new Exception($"Interview {previousInterviewId} is not eligible for next round: {checkResult.Message}");

        var nextRoundNo = previousInterview.RoundNo + 1;

        var existingNextRound = await _context.Interviews
            .AnyAsync(i => i.ApplicationId == previousInterview.ApplicationId
                && i.RoundNo == nextRoundNo
                && i.IsDeleted == false);

        if (existingNextRound)
            throw new Exception($"Round {nextRoundNo} has already been created for this application");

        var conflictResult = await _conflictService.CheckAllConflictsAsync(
            previousInterview.ApplicationId,
            distinctInterviewerIds,
            request.StartTime,
            request.EndTime);

        if (!conflictResult.CanProceed)
        {
            var conflictMessage = string.Join("; ", conflictResult.Conflicts
                .Where(c => c.Severity == "ERROR")
                .Select(c => $"{c.UserName} conflict with interview {c.ConflictingInterviewId}"));
            throw new Exception($"Cannot schedule next round due to conflicts: {conflictMessage}");
        }

        var scheduledStatus = await _context.Statuses.FirstOrDefaultAsync(s => s.Code == "SCHEDULED");
        if (scheduledStatus == null)
            throw new Exception("SCHEDULED status not found");

        var newInterview = new Interview
        {
            ApplicationId = previousInterview.ApplicationId,
            RoundNo = nextRoundNo,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Location = request.Location,
            MeetingLink = request.MeetingLink,
            StatusId = scheduledStatus.Id,
            CreatedBy = createdBy,
            CreatedAt = DateTime.Now
        };

        _context.Interviews.Add(newInterview);
        await _context.SaveChangesAsync();

        foreach (var interviewerId in distinctInterviewerIds)
        {
            _context.InterviewParticipants.Add(new InterviewParticipant
            {
                InterviewId = newInterview.Id,
                UserId = interviewerId
            });
        }

        previousInterview.IsNextRoundScheduled = true;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return newInterview.Id;
    }

    private async Task<InterviewRoundDecisionDto?> BuildRoundDecisionDtoAsync(int interviewId)
    {
        var decision = await _context.InterviewRoundDecisions
            .Include(d => d.DecidedByNavigation)
            .FirstOrDefaultAsync(d => d.InterviewId == interviewId);

        if (decision == null)
            return null;

        return new InterviewRoundDecisionDto
        {
            InterviewId = decision.InterviewId,
            DecisionCode = decision.DecisionCode,
            Note = decision.Note,
            DecidedBy = decision.DecidedBy,
            DecidedByName = decision.DecidedByNavigation.FullName,
            DecidedAt = decision.DecidedAt
        };
    }
}
