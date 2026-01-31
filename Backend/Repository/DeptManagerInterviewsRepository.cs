using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class DeptManagerInterviewsRepository : IDeptManagerInterviewsRepository
{
    private readonly RecruitmentDbContext _context;

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
            .Where(ip => ip.UserId == managerId && !ip.Interview.IsDeleted!.Value)
            .Select(ip => ip.Interview)
            .Distinct()
            .OrderByDescending(i => i.StartTime)
            .ToListAsync();
    }

    public async Task<List<Interview>> GetUpcomingInterviewsByManagerIdAsync(int managerId)
    {
        var now = DateTime.Now;
        return await _context.InterviewParticipants
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Application)
                    .ThenInclude(a => a.Cvprofile)
            .Include(ip => ip.Interview)
                .ThenInclude(i => i.Application)
                    .ThenInclude(a => a.JobRequest)
                        .ThenInclude(jr => jr.Position)
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
            .Where(ip => ip.UserId == managerId && 
                         ip.Interview.StartTime > now &&
                         !ip.Interview.IsDeleted!.Value)
            .Select(ip => ip.Interview)
            .Distinct()
            .OrderBy(i => i.StartTime)
            .Take(10)
            .ToListAsync();
    }

    public async Task<Interview?> GetInterviewByIdAsync(int id, int managerId)
    {
        return await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(p => p.User)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(p => p.InterviewRole)
            .Include(i => i.InterviewFeedbacks)
            .FirstOrDefaultAsync(i => i.Id == id && 
                                     i.InterviewParticipants.Any(p => p.UserId == managerId) &&
                                     !i.IsDeleted!.Value);
    }

    public async Task<bool> IsInterviewParticipantAsync(int interviewId, int managerId)
    {
        return await _context.InterviewParticipants
            .AnyAsync(ip => ip.InterviewId == interviewId && ip.UserId == managerId);
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
        application.UpdatedAt = DateTime.Now;
        application.UpdatedBy = updatedBy;

        // Add status history
        _context.StatusHistories.Add(new StatusHistory
        {
            EntityTypeId = 3, // Application
            EntityId = applicationId,
            FromStatusId = oldStatusId,
            ToStatusId = statusId,
            ChangedBy = updatedBy,
            ChangedAt = DateTime.Now,
            Note = comment
        });

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<EvaluationCriterion>> GetEvaluationCriteriaByPositionAsync(int positionId)
    {
        // Note: EvaluationTemplate doesn't have PositionId property
        // This method needs to be redesigned based on actual business logic
        // For now, return all criteria from all templates
        return await _context.EvaluationCriteria
            .ToListAsync();
    }
}
