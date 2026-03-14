using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Candidate;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class CandidateInterviewsRepository : ICandidateInterviewsRepository
{
    private readonly RecruitmentDbContext _context;

    public CandidateInterviewsRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    private async Task<int> GetStatusIdAsync(string code)
        => await _context.Statuses.Where(s => s.Code == code).Select(s => s.Id).FirstAsync();

    public async Task<List<CandidateInterviewListDto>> GetInterviewsAsync(int candidateId)
    {
        return await _context.Interviews
            .Where(i =>
                i.Application.Cvprofile.CandidateId == candidateId &&
                i.IsDeleted == false)
            .OrderByDescending(i => i.StartTime)
            .Select(i => new CandidateInterviewListDto
            {
                Id             = i.Id,
                RoundNo        = i.RoundNo,
                PositionTitle  = i.Application.JobRequest.Position.Title,
                DepartmentName = i.Application.JobRequest.Position.Department.Name,
                StartTime      = i.StartTime,
                EndTime        = i.EndTime,
                Location       = i.Location,
                MeetingLink    = i.MeetingLink,
                StatusCode     = i.Status.Code,
                StatusName     = i.Status.Name
            })
            .ToListAsync();
    }

    public async Task<bool> RespondAsync(int interviewId, int candidateId, bool confirm)
    {
        var interview = await _context.Interviews
            .Include(i => i.Status)
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
            .FirstOrDefaultAsync(i =>
                i.Id == interviewId &&
                i.Application.Cvprofile.CandidateId == candidateId &&
                i.IsDeleted == false);

        if (interview == null) return false;

        // Chỉ được phản hồi khi đang SCHEDULED hoặc RESCHEDULED
        if (interview.Status.Code is not ("SCHEDULED" or "RESCHEDULED"))
            return false;

        interview.StatusId = await GetStatusIdAsync(confirm ? "CONFIRMED" : "DECLINED_BY_CANDIDATE");
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<CandidateInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int candidateId)
    {
        var interview = await _context.Interviews
            .Include(i => i.Application)
                .ThenInclude(a => a.Cvprofile)
            .Include(i => i.Application)
                .ThenInclude(a => a.JobRequest)
                    .ThenInclude(jr => jr.Position)
                        .ThenInclude(p => p.Department)
            .Include(i => i.Status)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(ip => ip.User)
            .Include(i => i.InterviewParticipants)
                .ThenInclude(ip => ip.InterviewRole)
            .FirstOrDefaultAsync(i =>
                i.Id == interviewId &&
                i.Application.Cvprofile.CandidateId == candidateId &&
                i.IsDeleted == false);

        if (interview == null) return null;

        var previousRounds = await _context.Interviews
            .Include(i => i.Status)
            .Where(i => i.ApplicationId == interview.ApplicationId
                        && i.RoundNo < interview.RoundNo
                        && i.IsDeleted == false)
            .OrderBy(i => i.RoundNo)
            .Select(i => new CandidatePreviousRoundDto
            {
                RoundNo = i.RoundNo,
                StartTime = i.StartTime,
                StatusCode = i.Status.Code,
                StatusName = i.Status.Name
            })
            .ToListAsync();

        return new CandidateInterviewDetailDto
        {
            Id = interview.Id,
            RoundNo = interview.RoundNo,
            PositionTitle = interview.Application.JobRequest.Position.Title,
            DepartmentName = interview.Application.JobRequest.Position.Department.Name,
            StartTime = interview.StartTime,
            EndTime = interview.EndTime,
            Location = interview.Location,
            MeetingLink = interview.MeetingLink,
            StatusCode = interview.Status.Code,
            StatusName = interview.Status.Name,
            Participants = interview.InterviewParticipants.Select(p => new CandidateInterviewParticipantDto
            {
                FullName = p.User.FullName,
                Role = p.InterviewRole?.Name ?? "Người phỏng vấn"
            }).ToList(),
            PreviousRounds = previousRounds
        };
    }
}
