using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Service;

public class InterviewRoundSummaryService : IInterviewRoundSummaryService
{
    private readonly RecruitmentDbContext _context;

    public InterviewRoundSummaryService(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<InterviewRoundSummarySnapshot> BuildSummaryAsync(int interviewId)
    {
        var totalInterviewers = await _context.InterviewParticipants
            .CountAsync(ip => ip.InterviewId == interviewId);

        var feedbacks = await _context.InterviewFeedbacks
            .Include(f => f.InterviewScores)
            .Where(f => f.InterviewId == interviewId)
            .ToListAsync();

        var allScores = feedbacks
            .SelectMany(f => f.InterviewScores)
            .Select(s => (decimal?)s.Score)
            .ToList();

        var recommendationSummary = new InterviewRecommendationSummaryDto
        {
            StrongHireCount = feedbacks.Count(f => f.Recommendation == InterviewWorkflowHelper.RecommendationStrongHire),
            HireCount = feedbacks.Count(f => f.Recommendation == InterviewWorkflowHelper.RecommendationHire),
            NoHireCount = feedbacks.Count(f => f.Recommendation == InterviewWorkflowHelper.RecommendationNoHire),
            StrongNoHireCount = feedbacks.Count(f => f.Recommendation == InterviewWorkflowHelper.RecommendationStrongNoHire)
        };

        return new InterviewRoundSummarySnapshot
        {
            InterviewId = interviewId,
            TotalInterviewers = totalInterviewers,
            SubmittedFeedbacks = feedbacks.Select(f => f.InterviewerId).Distinct().Count(),
            AverageScore = allScores.Count == 0 ? null : allScores.Average(),
            RecommendationSummary = recommendationSummary
        };
    }
}