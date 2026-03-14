using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class ParticipantRequestRepository : IParticipantRequestRepository
{
    private readonly RecruitmentDbContext _context;

    public ParticipantRequestRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<ParticipantRequestDto> CreateRequestAsync(int interviewId, CreateParticipantRequestDto dto, int fromUserId)
    {
        var request = new ParticipantRequest
        {
            InterviewId = interviewId,
            RequestedByUserId = fromUserId,
            AssignedToUserId = dto.AssignedToUserId,
            RequiredCount = dto.RequiredCount,
            Message = dto.Message,
            Status = "PENDING",
            CreatedAt = DateTime.Now
        };
        _context.ParticipantRequests.Add(request);
        await _context.SaveChangesAsync();

        return await BuildDto(request.Id) ?? throw new Exception("Failed to load created request");
    }

    public async Task<List<ParticipantRequestDto>> GetRequestsByInterviewAsync(int interviewId)
    {
        var ids = await _context.ParticipantRequests
            .Where(r => r.InterviewId == interviewId)
            .Select(r => r.Id)
            .ToListAsync();

        var result = new List<ParticipantRequestDto>();
        foreach (var id in ids)
        {
            var dto = await BuildDto(id);
            if (dto != null) result.Add(dto);
        }
        return result;
    }

    public async Task<List<ParticipantRequestDto>> GetAssignedRequestsAsync(int userId)
    {
        var ids = await _context.ParticipantRequests
            .Where(r => r.AssignedToUserId == userId && r.Status == "PENDING")
            .Select(r => r.Id)
            .ToListAsync();

        var result = new List<ParticipantRequestDto>();
        foreach (var id in ids)
        {
            var dto = await BuildDto(id);
            if (dto != null) result.Add(dto);
        }
        return result;
    }

    public async Task<List<ParticipantRequestDto>> GetForwardedRequestsAsync(int userId)
    {
        var ids = await _context.ParticipantRequests
            .Where(r => r.ForwardedToUserId == userId && r.Status == "FORWARDED")
            .Select(r => r.Id)
            .ToListAsync();

        var result = new List<ParticipantRequestDto>();
        foreach (var id in ids)
        {
            var dto = await BuildDto(id);
            if (dto != null) result.Add(dto);
        }
        return result;
    }

    public async Task<ParticipantRequestDto?> GetByIdAsync(int reqId)
        => await BuildDto(reqId);

    public async Task<bool> NominateAsync(int reqId, List<int> userIds, int nominatorUserId)
    {
        var request = await _context.ParticipantRequests
            .Include(r => r.Interview)
            .FirstOrDefaultAsync(r => r.Id == reqId);

        if (request == null) return false;

        // Get INTERVIEWER role id
        var interviewerRole = await _context.InterviewRoles
            .FirstOrDefaultAsync(r => r.Code == "INTERVIEWER");

        foreach (var userId in userIds)
        {
            // Avoid duplicate participants
            var exists = await _context.InterviewParticipants
                .AnyAsync(p => p.InterviewId == request.InterviewId && p.UserId == userId);
            if (!exists)
            {
                _context.InterviewParticipants.Add(new InterviewParticipant
                {
                    InterviewId = request.InterviewId,
                    UserId = userId,
                    InterviewRoleId = interviewerRole?.Id
                });
            }
        }

        request.Status = "FULFILLED";
        request.RespondedAt = DateTime.Now;

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> ForwardToDirectorAsync(int reqId, int directorId, string? message, int fromUserId)
    {
        var original = await _context.ParticipantRequests.FindAsync(reqId);
        if (original == null || original.AssignedToUserId != fromUserId) return false;

        original.Status = "FORWARDED";
        original.ForwardedToUserId = directorId;
        original.RespondedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelAsync(int reqId, int requesterUserId)
    {
        var request = await _context.ParticipantRequests.FindAsync(reqId);
        if (request == null || request.RequestedByUserId != requesterUserId) return false;

        request.Status = "CANCELLED";
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<SimpleUserDto>> GetDeptMembersAsync(int userId)
    {
        // Get departments of this user
        var deptIds = await _context.UserDepartments
            .Where(ud => ud.UserId == userId)
            .Select(ud => ud.DepartmentId)
            .ToListAsync();

        if (!deptIds.Any()) return new();

        return await _context.UserDepartments
            .Where(ud => deptIds.Contains(ud.DepartmentId))
            .Select(ud => new SimpleUserDto
            {
                Id = ud.User.Id,
                FullName = ud.User.FullName,
                Email = ud.User.Email
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<List<SimpleUserDto>> GetAllDeptManagersAsync()
    {
        return await _context.Users
            .Where(u => u.Roles.Any(r => r.Code == "DEPARTMENT_MANAGER"))
            .Select(u => new SimpleUserDto { Id = u.Id, FullName = u.FullName, Email = u.Email })
            .OrderBy(u => u.FullName)
            .ToListAsync();
    }

    public async Task<List<SimpleUserDto>> GetAllDirectorsAsync()
    {
        return await _context.Users
            .Where(u => u.Roles.Any(r => r.Code == "DIRECTOR"))
            .Select(u => new SimpleUserDto { Id = u.Id, FullName = u.FullName, Email = u.Email })
            .OrderBy(u => u.FullName)
            .ToListAsync();
    }

    private async Task<ParticipantRequestDto?> BuildDto(int reqId)
    {
        return await _context.ParticipantRequests
            .Where(r => r.Id == reqId)
            .Select(r => new ParticipantRequestDto
            {
                Id = r.Id,
                InterviewId = r.InterviewId,
                CandidateName = r.Interview.Application.Cvprofile.FullName ?? "",
                PositionTitle = r.Interview.Application.JobRequest.Position.Title ?? "",
                StartTime = r.Interview.StartTime,
                RequestedByUserId = r.RequestedByUserId,
                RequestedByName = r.RequestedByUser.FullName,
                AssignedToUserId = r.AssignedToUserId,
                AssignedToName = r.AssignedToUser.FullName,
                RequiredCount = r.RequiredCount,
                Message = r.Message,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                ForwardedToUserId = r.ForwardedToUserId,
                ForwardedToName = r.ForwardedToUser != null ? r.ForwardedToUser.FullName : null
            })
            .FirstOrDefaultAsync();
    }
}
