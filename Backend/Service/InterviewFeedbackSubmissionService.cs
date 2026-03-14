using RMS.Common;
using RMS.Data;
using RMS.Entity;
using RMS.Service.Interface;

namespace RMS.Service;

public class InterviewFeedbackSubmissionService : IInterviewFeedbackSubmissionService
{
    private readonly RecruitmentDbContext _context;

    public InterviewFeedbackSubmissionService(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task SubmitAsync(
        int interviewId,
        int interviewerId,
        string decision,
        string? comment)
    {
        var feedback = new InterviewFeedback
        {
            InterviewId = interviewId,
            InterviewerId = interviewerId,
            Recommendation = InterviewWorkflowHelper.NormalizeRecommendation(decision),
            Note = comment,
            CreatedAt = DateTimeHelper.Now
        };

        _context.InterviewFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();
    }
}