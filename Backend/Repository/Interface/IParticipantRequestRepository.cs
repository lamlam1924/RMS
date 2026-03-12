using RMS.Dto.HR;

namespace RMS.Repository.Interface;

public interface IParticipantRequestRepository
{
    Task<ParticipantRequestDto> CreateRequestAsync(int interviewId, CreateParticipantRequestDto dto, int fromUserId);
    Task<List<ParticipantRequestDto>> GetRequestsByInterviewAsync(int interviewId);
    /// <summary>Requests assigned to this user (waiting for their response)</summary>
    Task<List<ParticipantRequestDto>> GetAssignedRequestsAsync(int userId);
    /// <summary>Requests forwarded to this user by HR Manager</summary>
    Task<List<ParticipantRequestDto>> GetForwardedRequestsAsync(int userId);
    Task<ParticipantRequestDto?> GetByIdAsync(int reqId);
    Task<bool> NominateAsync(int reqId, List<int> userIds, int nominatorUserId);
    Task<bool> ForwardToDirectorAsync(int reqId, int directorId, string? message, int fromUserId);
    Task<bool> CancelAsync(int reqId, int requesterUserId);
    Task<List<SimpleUserDto>> GetDeptMembersAsync(int userId);
    /// <summary>All users with DEPARTMENT_MANAGER role (for HR to pick whom to send request to)</summary>
    Task<List<SimpleUserDto>> GetAllDeptManagersAsync();
    /// <summary>All users with DIRECTOR role (for HR Manager to forward senior requests)</summary>
    Task<List<SimpleUserDto>> GetAllDirectorsAsync();
}
