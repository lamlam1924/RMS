using Microsoft.EntityFrameworkCore;
using RMS.Common;
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
        var interview = await _context.Interviews.FindAsync(interviewId);
        if (interview == null) throw new ArgumentException("Interview not found");

        var request = new ParticipantRequest
        {
            InterviewId = interviewId,
            RequestedByUserId = fromUserId,
            AssignedToUserId = dto.AssignedToUserId,
            RequiredCount = dto.RequiredCount,
            Message = dto.Message,
            Status = "PENDING",
            CreatedAt = DateTimeHelper.Now
        };
        request.Interviews.Add(interview);
        _context.ParticipantRequests.Add(request);
        await _context.SaveChangesAsync();

        return await BuildDto(request.Id) ?? throw new Exception("Failed to load created request");
    }

    public async Task<ParticipantRequestDto> CreateBatchRequestAsync(CreateParticipantRequestBatchDto dto, int fromUserId)
    {
        if (dto.InterviewIds == null || !dto.InterviewIds.Any())
            throw new ArgumentException("InterviewIds required");

        var interviewEntities = await _context.Interviews
            .Include(i => i.Application).ThenInclude(a => a.JobRequest!).ThenInclude(jr => jr.Position)
            .Where(i => dto.InterviewIds.Contains(i.Id))
            .OrderBy(i => i.StartTime)
            .ToListAsync();

        if (interviewEntities.Count == 0)
            throw new ArgumentException("No valid interviews found");

        var first = interviewEntities.First();
        var last = interviewEntities.Last();
        var request = new ParticipantRequest
        {
            InterviewId = null,
            RequestedByUserId = fromUserId,
            AssignedToUserId = dto.AssignedToUserId,
            RequiredCount = dto.RequiredCount,
            Message = dto.Message,
            Status = "PENDING",
            CreatedAt = DateTimeHelper.Now,
            TimeRangeStart = first.StartTime,
            TimeRangeEnd = last.EndTime,
            PositionTitle = first.Application?.JobRequest?.Position?.Title ?? "",
            DepartmentId = first.Application?.JobRequest?.Position?.DepartmentId,
            TitleLabel = interviewEntities.Count > 1 ? $"Block {interviewEntities.Count} buổi" : null
        };
        foreach (var i in interviewEntities)
            request.Interviews.Add(i);
        _context.ParticipantRequests.Add(request);
        await _context.SaveChangesAsync();

        return await BuildDto(request.Id) ?? throw new Exception("Failed to load created request");
    }

    public async Task<List<ParticipantRequestDto>> GetRequestsByInterviewAsync(int interviewId)
    {
        var ids = await _context.ParticipantRequests
            .Where(r => r.InterviewId == interviewId || r.Interviews.Any(i => i.Id == interviewId))
            .Select(r => r.Id)
            .Distinct()
            .ToListAsync();

        var result = new List<ParticipantRequestDto>();
        foreach (var id in ids)
        {
            var dto = await BuildDto(id);
            if (dto != null) result.Add(dto);
        }
        return result;
    }

    /// <summary>Tất cả yêu cầu đề cử được giao cho user (trưởng phòng): cả đang chờ và đã xử lý, để hiển thị "Cần xử lý" + "Lịch sử đã xử lý".</summary>
    public async Task<List<ParticipantRequestDto>> GetAssignedRequestsAsync(int userId)
    {
        var ids = await _context.ParticipantRequests
            .Where(r => r.AssignedToUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
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
            .Include(r => r.Interviews)
            .FirstOrDefaultAsync(r => r.Id == reqId);

        if (request == null) return false;
        var canNominate = (request.AssignedToUserId == nominatorUserId && request.Status == "PENDING")
            || (request.ForwardedToUserId == nominatorUserId && request.Status == "FORWARDED");
        if (!canNominate)
            return false;

        var interviewIds = request.Interviews.Any()
            ? request.Interviews.Select(i => i.Id).ToList()
            : (request.InterviewId.HasValue ? new List<int> { request.InterviewId.Value } : new List<int>());

        if (!interviewIds.Any()) return false;

        var interviewerRole = await _context.InterviewRoles.FirstOrDefaultAsync(r => r.Code == "INTERVIEWER");

        foreach (var interviewId in interviewIds)
        {
            foreach (var userId in userIds)
            {
                var exists = await _context.InterviewParticipants
                    .AnyAsync(p => p.InterviewId == interviewId && p.UserId == userId);
                if (!exists)
                {
                    _context.InterviewParticipants.Add(new InterviewParticipant
                    {
                        InterviewId = interviewId,
                        UserId = userId,
                        InterviewRoleId = interviewerRole?.Id
                    });
                }
            }
        }

        request.Status = "FULFILLED";
        request.RespondedAt = DateTimeHelper.Now;

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> ForwardToDirectorAsync(int reqId, int directorId, string? message, int fromUserId)
    {
        var original = await _context.ParticipantRequests.FindAsync(reqId);
        if (original == null || original.AssignedToUserId != fromUserId) return false;

        original.Status = "FORWARDED";
        original.ForwardedToUserId = directorId;
        original.RespondedAt = DateTimeHelper.Now;

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

    /// <summary>Trưởng phòng ban (DEPARTMENT_MANAGER); có kèm tên phòng ban để HR biết chọn đúng người đề cử.</summary>
    public async Task<List<SimpleUserDto>> GetAllDeptManagersAsync()
    {
        var managers = await _context.Users
            .Where(u => u.Roles.Any(r => r.Code == "DEPARTMENT_MANAGER"))
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                DepartmentId = _context.Departments.Where(d => d.HeadUserId == u.Id).Select(d => (int?)d.Id).FirstOrDefault(),
                DepartmentName = _context.Departments.Where(d => d.HeadUserId == u.Id).Select(d => d.Name).FirstOrDefault()
            })
            .OrderBy(u => u.FullName)
            .ToListAsync();

        return managers.Select(m => new SimpleUserDto
        {
            Id = m.Id,
            FullName = m.FullName,
            Email = m.Email,
            DepartmentId = m.DepartmentId,
            DepartmentName = m.DepartmentName
        }).ToList();
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
        var request = await _context.ParticipantRequests
            .Include(r => r.Interviews)
            .ThenInclude(i => i.Application)
            .ThenInclude(a => a.Cvprofile)
            .Include(r => r.Interviews)
            .ThenInclude(i => i.Application)
            .ThenInclude(a => a.JobRequest!)
            .ThenInclude(jr => jr.Position)
            .Include(r => r.RequestedByUser)
            .Include(r => r.AssignedToUser)
            .Include(r => r.ForwardedToUser)
            .Include(r => r.Department)
            .FirstOrDefaultAsync(r => r.Id == reqId);

        if (request == null) return null;

        var interviewList = request.Interviews
            .OrderBy(i => i.StartTime)
            .Select(i => new ParticipantRequestInterviewItemDto
            {
                InterviewId = i.Id,
                CandidateName = i.Application?.Cvprofile?.FullName ?? "",
                StartTime = i.StartTime,
                EndTime = i.EndTime
            })
            .ToList();

        if (!interviewList.Any() && request.InterviewId.HasValue)
        {
            var single = await _context.Interviews
                .Include(i => i.Application).ThenInclude(a => a.Cvprofile)
                .Include(i => i.Application).ThenInclude(a => a.JobRequest!).ThenInclude(jr => jr.Position)
                .FirstOrDefaultAsync(i => i.Id == request.InterviewId);
            if (single != null)
                interviewList.Add(new ParticipantRequestInterviewItemDto
                {
                    InterviewId = single.Id,
                    CandidateName = single.Application?.Cvprofile?.FullName ?? "",
                    StartTime = single.StartTime,
                    EndTime = single.EndTime
                });
        }

        var firstInterview = interviewList.FirstOrDefault();
        return new ParticipantRequestDto
        {
            Id = request.Id,
            InterviewId = request.InterviewId ?? firstInterview?.InterviewId,
            CandidateName = firstInterview?.CandidateName ?? "",
            PositionTitle = request.PositionTitle ?? request.Interviews.FirstOrDefault()?.Application?.JobRequest?.Position?.Title ?? "",
            StartTime = firstInterview?.StartTime,
            RequestedByUserId = request.RequestedByUserId,
            RequestedByName = request.RequestedByUser.FullName,
            AssignedToUserId = request.AssignedToUserId,
            AssignedToName = request.AssignedToUser.FullName,
            RequiredCount = request.RequiredCount,
            Message = request.Message,
            Status = request.Status,
            CreatedAt = request.CreatedAt,
            ForwardedToUserId = request.ForwardedToUserId,
            ForwardedToName = request.ForwardedToUser?.FullName,
            TimeRangeStart = request.TimeRangeStart,
            TimeRangeEnd = request.TimeRangeEnd,
            DepartmentId = request.DepartmentId,
            DepartmentName = request.Department?.Name,
            TitleLabel = request.TitleLabel,
            Interviews = interviewList
        };
    }
}
