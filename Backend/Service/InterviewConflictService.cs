using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Service;

/// <summary>
/// Service for detecting interview scheduling conflicts
/// Only checks conflicts between interviews - does NOT manage user availability/working hours
/// </summary>
public class InterviewConflictService : IInterviewConflictService
{
    private readonly RecruitmentDbContext _context;

    public InterviewConflictService(RecruitmentDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Check if interviewers have conflicting interviews
    /// </summary>
    public async Task<List<InterviewConflictDto>> CheckInterviewerConflictsAsync(
        List<int> interviewerIds,
        DateTime startTime,
        DateTime endTime,
        int? excludeInterviewId = null)
    {
        if (interviewerIds == null || interviewerIds.Count == 0)
            return new List<InterviewConflictDto>();

        if (endTime <= startTime)
            throw new InvalidOperationException("End time must be greater than start time");

        var normalizedInterviewerIds = interviewerIds.Distinct().ToList();
        var conflicts = new List<InterviewConflictDto>();

        // Query interviews của các interviewer trong khoảng thời gian
        var conflictingInterviews = await _context.Interviews
            .Where(i => i.IsDeleted == false &&
                       (excludeInterviewId == null || i.Id != excludeInterviewId) &&
                       i.InterviewParticipants.Any(ip => normalizedInterviewerIds.Contains(ip.UserId)) &&
                       i.Status.Code != "CANCELLED" &&
                       i.Status.Code != "COMPLETED" &&
                       i.Status.Code != "NO_SHOW" &&
                       i.Status.Code != "INTERVIEWER_ABSENT" &&
                       i.StartTime < endTime &&
                       i.EndTime > startTime)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(ip => ip.User)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Candidate)
            .ToListAsync();

        // Group by interviewer
        foreach (var interviewerId in normalizedInterviewerIds)
        {
            var userConflicts = conflictingInterviews
                .Where(i => i.InterviewParticipants.Any(ip => ip.UserId == interviewerId))
                .ToList();

            foreach (var conflictInterview in userConflicts)
            {
                var interviewer = conflictInterview.InterviewParticipants
                    .First(ip => ip.UserId == interviewerId).User;

                conflicts.Add(new InterviewConflictDto
                {
                    ConflictingInterviewId = conflictInterview.Id,
                    UserId = interviewerId,
                    UserName = interviewer?.FullName ?? $"User {interviewerId}",
                    CandidateName = conflictInterview.Application?.Cvprofile?.Candidate?.FullName ?? "Unknown candidate",
                    ConflictStart = conflictInterview.StartTime,
                    ConflictEnd = conflictInterview.EndTime,
                    ConflictType = "INTERVIEWER",
                    Severity = "ERROR"
                });
            }
        }

        return conflicts
            .GroupBy(c => new { c.ConflictingInterviewId, c.UserId })
            .Select(g => g.First())
            .ToList();
    }

    /// <summary>
    /// Check if candidate has conflicting interview
    /// </summary>
    public async Task<InterviewConflictDto?> CheckCandidateConflictAsync(
        int candidateId,
        DateTime startTime,
        DateTime endTime,
        int? excludeInterviewId = null)
    {
        if (candidateId <= 0)
            return null;

        if (endTime <= startTime)
            throw new InvalidOperationException("End time must be greater than start time");

        var conflictingInterview = await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Candidate)
            .Where(i => i.Application.Cvprofile.CandidateId == candidateId &&
                       i.IsDeleted == false &&
                       (excludeInterviewId == null || i.Id != excludeInterviewId) &&
                       i.Status.Code != "CANCELLED" &&
                       i.Status.Code != "COMPLETED" &&
                       i.Status.Code != "NO_SHOW" &&
                       i.Status.Code != "INTERVIEWER_ABSENT" &&
                       i.StartTime < endTime &&
                       i.EndTime > startTime)
            .FirstOrDefaultAsync();

        if (conflictingInterview == null)
            return null;

        return new InterviewConflictDto
        {
            ConflictingInterviewId = conflictingInterview.Id,
            UserId = candidateId,
            UserName = conflictingInterview.Application?.Cvprofile?.Candidate?.FullName ?? $"Candidate {candidateId}",
            CandidateName = conflictingInterview.Application?.Cvprofile?.Candidate?.FullName ?? "Unknown candidate",
            ConflictStart = conflictingInterview.StartTime,
            ConflictEnd = conflictingInterview.EndTime,
            ConflictType = "CANDIDATE",
            Severity = "WARNING" // Candidate conflict is warning, not error
        };
    }

    /// <summary>
    /// Check all conflicts (interviewer + candidate)
    /// </summary>
    public async Task<ConflictCheckResultDto> CheckAllConflictsAsync(
        int applicationId,
        List<int> interviewerIds,
        DateTime startTime,
        DateTime endTime,
        int? excludeInterviewId = null)
    {
        if (applicationId <= 0)
            throw new InvalidOperationException("ApplicationId is required");

        if (endTime <= startTime)
            throw new InvalidOperationException("End time must be greater than start time");

        var result = new ConflictCheckResultDto
        {
            HasConflicts = false,
            Conflicts = new List<InterviewConflictDto>()
        };

        // Get candidate ID
        var candidateId = await _context.Applications
            .Where(a => a.Id == applicationId)
            .Select(a => a.Cvprofile.CandidateId)
            .FirstOrDefaultAsync();

        if (candidateId <= 0)
            throw new InvalidOperationException($"Application {applicationId} not found or has no candidate");

        // Check interviewer conflicts
        var interviewerConflicts = await CheckInterviewerConflictsAsync(
            interviewerIds, startTime, endTime, excludeInterviewId);

        if (interviewerConflicts.Any())
        {
            result.HasConflicts = true;
            result.Conflicts.AddRange(interviewerConflicts);
        }

        // Check candidate conflict
        if (candidateId > 0)
        {
            var candidateConflict = await CheckCandidateConflictAsync(
                candidateId, startTime, endTime, excludeInterviewId);

            if (candidateConflict != null)
            {
                result.HasConflicts = true;
                result.Conflicts.Add(candidateConflict);
            }
        }

        // Can proceed if no ERROR severity conflicts (WARNING is ok)
        result.CanProceed = !result.Conflicts.Any(c => c.Severity == "ERROR");

        return result;
    }

    /// <summary>
    /// Find available time slots for interviewers
    /// Searches 30-minute intervals during working hours (9 AM - 6 PM)
    /// </summary>
    public async Task<List<TimeSlotDto>> FindAvailableTimeSlotsAsync(
        List<int> interviewerIds,
        DateTime dateFrom,
        DateTime dateTo,
        int durationMinutes)
    {
        if (interviewerIds == null || interviewerIds.Count == 0)
            throw new InvalidOperationException("At least one interviewer is required");

        if (durationMinutes <= 0)
            throw new InvalidOperationException("DurationMinutes must be greater than zero");

        if (dateTo < dateFrom)
            throw new InvalidOperationException("DateTo must be greater than or equal to DateFrom");

        var slots = new List<TimeSlotDto>();
        var currentDate = dateFrom.Date;
        var normalizedInterviewerIds = interviewerIds.Distinct().ToList();

        while (currentDate <= dateTo.Date)
        {
            // Working hours: 9 AM - 6 PM
            var workStart = currentDate.AddHours(9);
            var workEnd = currentDate.AddHours(18);

            var currentTime = workStart;
            while (currentTime.AddMinutes(durationMinutes) <= workEnd)
            {
                var slotEnd = currentTime.AddMinutes(durationMinutes);

                // Check conflicts for this slot
                var interviewerConflicts = await CheckInterviewerConflictsAsync(
                    normalizedInterviewerIds,
                    currentTime,
                    slotEnd);

                // Get list of available interviewers (no ERROR conflicts)
                var conflictedUserIds = interviewerConflicts
                    .Where(c => c.Severity == "ERROR")
                    .Select(c => c.UserId)
                    .ToHashSet();

                var availableInterviewers = normalizedInterviewerIds
                    .Where(id => !conflictedUserIds.Contains(id))
                    .ToList();

                // Add slot if at least one interviewer is available
                if (availableInterviewers.Any())
                {
                    slots.Add(new TimeSlotDto
                    {
                        StartTime = currentTime,
                        EndTime = slotEnd,
                        AvailableInterviewerIds = availableInterviewers,
                        ConflictCount = normalizedInterviewerIds.Count - availableInterviewers.Count
                    });
                }

                // Move to next slot (30 min intervals)
                currentTime = currentTime.AddMinutes(30);
            }

            currentDate = currentDate.AddDays(1);
        }

        return slots;
    }
}
