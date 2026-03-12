using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Entity;

namespace RMS.Repository;

public class EmployeeInterviewsRepository : IEmployeeInterviewsRepository
{
    private readonly RecruitmentDbContext _context;

    public EmployeeInterviewsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<Interview>> GetInterviewsByParticipantIdAsync(int userId)
    {
        return await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
            .Include(i => i.Status)
            .Where(i => i.InterviewParticipants.Any(ip => ip.UserId == userId))
            .OrderByDescending(i => i.StartTime)
            .ToListAsync();
    }

    public async Task<List<Interview>> GetUpcomingInterviewsByParticipantIdAsync(int userId)
    {
        var now = DateTimeHelper.Now;
        var next7Days = now.AddDays(7);

        return await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
            .Include(i => i.Status)
            .Where(i => i.InterviewParticipants.Any(ip => ip.UserId == userId)
                     && i.StartTime >= now
                     && i.StartTime <= next7Days)
            .OrderBy(i => i.StartTime)
            .ToListAsync();
    }

    public async Task<Interview?> GetInterviewByIdAsync(int interviewId)
    {
        return await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Cvexperiences)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
                    .ThenInclude(cv => cv.Cveducations)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(ip => ip.User)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(ip => ip.InterviewRole)
            .FirstOrDefaultAsync(i => i.Id == interviewId);
    }

    public async Task<bool> IsInterviewParticipantAsync(int interviewId, int userId)
    {
        return await _context.InterviewParticipants
            .AnyAsync(ip => ip.InterviewId == interviewId && ip.UserId == userId);
    }

    public async Task<InterviewFeedback?> GetFeedbackByInterviewerAsync(int interviewId, int userId)
    {
        return await _context.InterviewFeedbacks
            .FirstOrDefaultAsync(f => f.InterviewId == interviewId && f.InterviewerId == userId);
    }

    public async Task<InterviewFeedback> CreateFeedbackAsync(InterviewFeedback feedback)
    {
        _context.InterviewFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();
        return feedback;
    }

    public async Task AddInterviewScoresAsync(List<InterviewScore> scores)
    {
        _context.InterviewScores.AddRange(scores);
        await _context.SaveChangesAsync();
    }

    public async Task<List<EvaluationCriterion>> GetEvaluationCriteriaByPositionAsync(int positionId)
    {
        var criteria = await _context.EvaluationCriteria
            .Include(c => c.Template)
            .Where(c => c.Template.PositionId == positionId)
            .ToListAsync();

        if (criteria.Count == 0)
        {
            // Fallback: template chung không gắn với position cụ thể
            criteria = await _context.EvaluationCriteria
                .Include(c => c.Template)
                .Where(c => c.Template.PositionId == null)
                .ToListAsync();
        }

        return criteria;
    }

    public async Task UpdateApplicationStatusAsync(int applicationId, int statusId)
    {
        var application = await _context.Applications.FindAsync(applicationId);
        if (application != null)
        {
            application.StatusId = statusId;
            application.UpdatedAt = DateTimeHelper.Now;
            await _context.SaveChangesAsync();
        }
    }
}
