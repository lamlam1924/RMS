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

    public async Task<List<InterviewListDto>> GetInterviewsAsync()
    {
        return await _context.Interviews
            .Where(i => i.IsDeleted == false)
            .OrderBy(i => i.StartTime)
            .Select(i => new InterviewListDto
            {
                Id = i.Id,
                ApplicationId = i.ApplicationId,
                CandidateName = i.Application.Cvprofile.Candidate.FullName,
                PositionTitle = i.Application.JobRequest.Position.Title,
                DepartmentName = i.Application.JobRequest.Position.Department.Name,
                ScheduledAt = i.StartTime,
                Location = i.Location ?? "",
                Status = i.Status.Name
            })
            .ToListAsync();
    }

    public async Task<List<InterviewListDto>> GetUpcomingInterviewsAsync()
    {
        return await _context.Interviews
            .Where(i => i.StartTime > DateTimeHelper.Now && i.IsDeleted == false)
            .OrderBy(i => i.StartTime)
            .Select(i => new InterviewListDto
            {
                Id = i.Id,
                ApplicationId = i.ApplicationId,
                CandidateName = i.Application.Cvprofile.Candidate.FullName,
                PositionTitle = i.Application.JobRequest.Position.Title,
                DepartmentName = i.Application.JobRequest.Position.Department.Name,
                ScheduledAt = i.StartTime,
                Location = i.Location ?? "",
                Status = i.Status.Name
            })
            .ToListAsync();
    }

    public async Task<int> CreateInterviewAsync(int applicationId, DateTime scheduledAt, string? location, int userId)
    {
        var interview = new Interview
        {
            ApplicationId = applicationId,
            RoundNo = 1,
            StartTime = scheduledAt,
            EndTime = scheduledAt.AddHours(1),
            Location = location,
            MeetingLink = null,
            StatusId = 11,
            CreatedAt = DateTimeHelper.Now,
            CreatedBy = userId,
            IsDeleted = false
        };

        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

        return interview.Id;
    }

    public async Task<bool> UpdateInterviewAsync(int interviewId, DateTime? scheduledAt, string? location, int userId)
    {
        var interview = await _context.Interviews.FindAsync(interviewId);
        if (interview == null) return false;

        if (scheduledAt.HasValue)
        {
            interview.StartTime = scheduledAt.Value;
            interview.EndTime = scheduledAt.Value.AddHours(1);
        }
        if (location != null)
        {
            interview.Location = location;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
