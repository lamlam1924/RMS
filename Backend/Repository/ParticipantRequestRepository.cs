using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;
using System.Text.Json;

namespace RMS.Repository;

public class ParticipantRequestRepository : IParticipantRequestRepository
{
    private readonly RecruitmentDbContext _context;

    private const int EntityTypeInterview = 4;
    private const string NominationHistoryType = "NOMINATION_PARTICIPANTS";

    private Task<int> GetStatusIdAsync(string code)
        => _context.Statuses.Where(s => s.Code == code).Select(s => s.Id).FirstAsync();

    public ParticipantRequestRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<ParticipantRequestDto> CreateRequestAsync(int interviewId, CreateParticipantRequestDto dto, int fromUserId)
    {
        var interview = await _context.Interviews.FindAsync(interviewId);
        if (interview == null) throw new ArgumentException("Interview not found");
        var pendingStatusId = await GetStatusIdAsync("PENDING");

        var request = new ParticipantRequest
        {
            InterviewId = interviewId,
            RequestedByUserId = fromUserId,
            AssignedToUserId = dto.AssignedToUserId,
            RequiredCount = dto.RequiredCount,
            Message = dto.Message,
            StatusId = pendingStatusId,
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

        var pendingStatusId = await GetStatusIdAsync("PENDING");

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
            StatusId = pendingStatusId,
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
            .Where(r => r.ForwardedToUserId == userId && r.Status.Code == "FORWARDED")
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
        var pendingStatusId = await GetStatusIdAsync("PENDING");
        var forwardedStatusId = await GetStatusIdAsync("FORWARDED");
        var fulfilledStatusId = await GetStatusIdAsync("FULFILLED");

        var request = await _context.ParticipantRequests
            .Include(r => r.Interviews)
            .Include(r => r.Status)
            .FirstOrDefaultAsync(r => r.Id == reqId);

        if (request == null) return false;

        var uniqueUserIds = (userIds ?? new List<int>()).Distinct().ToList();
        if (request.RequiredCount > 0 && uniqueUserIds.Count != request.RequiredCount)
            throw new ArgumentException($"Vui lòng đề cử đúng {request.RequiredCount} người.");

        var oldRequestStatusId = request.StatusId;
        var canNominate = (request.AssignedToUserId == nominatorUserId && request.StatusId == pendingStatusId)
            || (request.ForwardedToUserId == nominatorUserId && request.StatusId == forwardedStatusId);
        if (!canNominate)
            return false;

        var interviewIds = request.Interviews.Any()
            ? request.Interviews.Select(i => i.Id).ToList()
            : (request.InterviewId.HasValue ? new List<int> { request.InterviewId.Value } : new List<int>());

        if (!interviewIds.Any()) return false;

        DateTime? minStart = request.TimeRangeStart;
        DateTime? maxEnd = request.TimeRangeEnd;

        if (!minStart.HasValue || !maxEnd.HasValue)
        {
            var interviewsForRange = request.Interviews.Any() 
                ? request.Interviews.ToList() 
                : (request.InterviewId.HasValue ? new List<Interview> { await _context.Interviews.FindAsync(request.InterviewId.Value) } : new List<Interview>());

            var validInterviews = interviewsForRange.Where(i => i != null).ToList();
            if (validInterviews.Any())
            {
                minStart ??= validInterviews.Min(i => i.StartTime);
                maxEnd ??= validInterviews.Max(i => i.EndTime);
            }
        }
        
        if (minStart.HasValue && maxEnd.HasValue)
        {
            var cancelledStatusId = await GetStatusIdAsync("CANCELLED");
            
            var conflictingSchedules = await _context.InterviewParticipants
                .Include(p => p.User)
                .Include(p => p.Interview)
                .Where(p => uniqueUserIds.Contains(p.UserId)
                         && p.Interview.StartTime < maxEnd 
                         && p.Interview.EndTime > minStart
                         && !interviewIds.Contains(p.InterviewId)
                         && p.Interview.StatusId != cancelledStatusId
                         && p.DeclinedAt == null)
                .Select(p => new { p.UserId, UserName = p.User.FullName })
                .Distinct()
                .ToListAsync();

            if (conflictingSchedules.Any())
            {
                var names = string.Join(", ", conflictingSchedules.Select(x => x.UserName));
                throw new ArgumentException($"Không thể đề cử, các nhân viên sau đã có lịch bận trong thời gian block này: {names}");
            }
        }

        var interviewerRole = await _context.InterviewRoles.FirstOrDefaultAsync(r => r.Code == "INTERVIEWER");

        foreach (var interviewId in interviewIds)
        {
            var interviewStatusId = await _context.Interviews
                .Where(i => i.Id == interviewId)
                .Select(i => (int?)i.StatusId)
                .FirstOrDefaultAsync() ?? 0;

            foreach (var userId in uniqueUserIds)
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

            // Write nomination history on interview timeline (EntityTypeId=INTERVIEW)
            // Note holds structured JSON so we can rebuild "DM nominated who" later.
            // We keep ToStatusId = current interview status (no status change) to satisfy FK.
            var note = JsonSerializer.Serialize(new
            {
                type = NominationHistoryType,
                reqId,
                interviewId,
                userIds = uniqueUserIds
            });
            if (interviewStatusId > 0)
            {
                _context.StatusHistories.Add(new StatusHistory
                {
                    EntityTypeId = EntityTypeInterview,
                    EntityId = interviewId,
                    FromStatusId = interviewStatusId,
                    ToStatusId = interviewStatusId,
                    ChangedBy = nominatorUserId,
                    ChangedAt = DateTimeHelper.Now,
                    Note = note
                });
            }
        }

        request.StatusId = fulfilledStatusId;
        request.RespondedAt = DateTimeHelper.Now;

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<DeptManagerNominationHistoryItemDto>> GetNominationHistoryAsync(int nominatorUserId)
    {
        // Pull recent interview history logs created by this user and tagged as nomination events.
        var raw = await _context.StatusHistories
            .Where(h => h.EntityTypeId == EntityTypeInterview
                        && h.ChangedBy == nominatorUserId
                        && h.Note != null
                        && h.Note.Contains(NominationHistoryType))
            .OrderByDescending(h => h.ChangedAt)
            .Take(300)
            .Select(h => new
            {
                h.EntityId,
                h.ChangedAt,
                h.Note
            })
            .ToListAsync();

        if (!raw.Any()) return new();

        // Parse note JSON
        var parsed = new List<(int interviewId, int? reqId, DateTime changedAt, string? note, List<int> userIds)>();
        foreach (var h in raw)
        {
            try
            {
                using var doc = JsonDocument.Parse(h.Note!);
                var root = doc.RootElement;
                var type = root.TryGetProperty("type", out var t) ? t.GetString() : null;
                if (!string.Equals(type, NominationHistoryType, StringComparison.OrdinalIgnoreCase))
                    continue;

                var reqId = root.TryGetProperty("reqId", out var r) && r.ValueKind == JsonValueKind.Number ? r.GetInt32() : (int?)null;
                var ids = new List<int>();
                if (root.TryGetProperty("userIds", out var u) && u.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in u.EnumerateArray())
                        if (el.ValueKind == JsonValueKind.Number) ids.Add(el.GetInt32());
                }

                parsed.Add((h.EntityId, reqId, h.ChangedAt ?? DateTimeHelper.Now, h.Note, ids));
            }
            catch
            {
                // ignore malformed note
            }
        }

        if (!parsed.Any()) return new();

        var interviewIds = parsed.Select(p => p.interviewId).Distinct().ToList();
        var userIdsAll = parsed.SelectMany(p => p.userIds).Distinct().ToList();

        var interviews = await _context.Interviews
            .Include(i => i.Application).ThenInclude(a => a.Cvprofile)
            .Include(i => i.Application).ThenInclude(a => a.JobRequest!).ThenInclude(jr => jr.Position)
            .Where(i => interviewIds.Contains(i.Id))
            .Select(i => new
            {
                i.Id,
                CandidateName = i.Application!.Cvprofile!.FullName,
                PositionTitle = i.Application!.JobRequest!.Position!.Title,
                i.StartTime,
                i.EndTime
            })
            .ToDictionaryAsync(x => x.Id, x => x);

        var users = await _context.Users
            .Where(u => userIdsAll.Contains(u.Id))
            .Select(u => new SimpleUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email
            })
            .ToDictionaryAsync(x => x.Id, x => x);

        // Participation responses for nominated users (confirmed/declined)
        var participation = await _context.InterviewParticipants
            .Where(p => interviewIds.Contains(p.InterviewId) && userIdsAll.Contains(p.UserId))
            .Select(p => new
            {
                p.InterviewId,
                p.UserId,
                p.ConfirmedAt,
                p.DeclinedAt,
                p.DeclineNote
            })
            .ToListAsync();
        var participationMap = participation
            .GroupBy(x => (x.InterviewId, x.UserId))
            .ToDictionary(g => g.Key, g => g.First());

        var result = new List<DeptManagerNominationHistoryItemDto>();
        foreach (var p in parsed)
        {
            if (!interviews.TryGetValue(p.interviewId, out var i))
                continue;

            result.Add(new DeptManagerNominationHistoryItemDto
            {
                InterviewId = p.interviewId,
                RequestId = p.reqId,
                CreatedAt = p.changedAt,
                Note = p.note,
                CandidateName = i.CandidateName ?? "",
                PositionTitle = i.PositionTitle ?? "",
                StartTime = i.StartTime,
                EndTime = i.EndTime,
                NominatedUsers = p.userIds
                    .Distinct()
                    .Where(id => users.ContainsKey(id))
                    .Select(id =>
                    {
                        var baseUser = users[id];
                        participationMap.TryGetValue((p.interviewId, id), out var part);
                        var status = part?.DeclinedAt != null
                            ? "DECLINED"
                            : part?.ConfirmedAt != null
                                ? "CONFIRMED"
                                : "PENDING";
                        return new DeptManagerNominationHistoryUserDto
                        {
                            Id = baseUser.Id,
                            FullName = baseUser.FullName,
                            Email = baseUser.Email,
                            ParticipationStatus = status,
                            ConfirmedAt = part?.ConfirmedAt,
                            DeclinedAt = part?.DeclinedAt,
                            DeclineNote = part?.DeclineNote
                        };
                    })
                    .ToList()
            });
        }

        return result
            .OrderByDescending(x => x.CreatedAt)
            .ToList();
    }

    public async Task<bool> ForwardToDirectorAsync(int reqId, int directorId, string? message, int fromUserId)
    {
        var original = await _context.ParticipantRequests.FindAsync(reqId);
        if (original == null || original.AssignedToUserId != fromUserId) return false;

        var forwardedStatusId = await GetStatusIdAsync("FORWARDED");

        original.StatusId = forwardedStatusId;
        original.ForwardedToUserId = directorId;
        original.RespondedAt = DateTimeHelper.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelAsync(int reqId, int requesterUserId)
    {
        var request = await _context.ParticipantRequests.FindAsync(reqId);
        if (request == null || request.RequestedByUserId != requesterUserId) return false;

        var cancelledStatusId = await GetStatusIdAsync("CANCELLED");

        request.StatusId = cancelledStatusId;
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

    public async Task<List<SimpleUserDto>> GetDeptMembersAvailabilityAsync(int reqId, int userId)
    {
        var members = await GetDeptMembersAsync(userId);
        if (!members.Any()) return members;

        var request = await _context.ParticipantRequests
            .Include(r => r.Interviews)
            .FirstOrDefaultAsync(r => r.Id == reqId);
            
        if (request == null) return members;
        
        DateTime? minStart = request.TimeRangeStart;
        DateTime? maxEnd = request.TimeRangeEnd;

        if (!minStart.HasValue || !maxEnd.HasValue)
        {
            var interviewsForRange = request.Interviews.Any() 
                ? request.Interviews.ToList() 
                : (request.InterviewId.HasValue 
                    ? new List<Interview> { await _context.Interviews.FindAsync(request.InterviewId.Value) } 
                    : new List<Interview>());

            var validInterviews = interviewsForRange.Where(i => i != null).ToList();
            if (validInterviews.Any())
            {
                minStart ??= validInterviews.Min(i => i.StartTime);
                maxEnd ??= validInterviews.Max(i => i.EndTime);
            }
        }
        
        if (minStart.HasValue && maxEnd.HasValue)
        {
            var cancelledStatusId = await GetStatusIdAsync("CANCELLED");
            var memberIds = members.Select(m => m.Id).ToList();
            
            var interviewIds = request.Interviews.Any()
                ? request.Interviews.Select(i => i.Id).ToList()
                : (request.InterviewId.HasValue ? new List<int> { request.InterviewId.Value } : new List<int>());
            
            var busyUserIds = await _context.InterviewParticipants
                .Include(p => p.Interview)
                .Where(p => memberIds.Contains(p.UserId)
                         && p.Interview.StartTime < maxEnd 
                         && p.Interview.EndTime > minStart
                         && !interviewIds.Contains(p.InterviewId)
                         && p.Interview.StatusId != cancelledStatusId
                         && p.DeclinedAt == null)
                .Select(p => p.UserId)
                .Distinct()
                .ToListAsync();

            foreach (var m in members)
            {
                if (busyUserIds.Contains(m.Id))
                {
                    m.IsBusy = true;
                }
            }
        }

        return members;
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
            .Include(r => r.Status)
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
            Status = request.Status.Code,
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
