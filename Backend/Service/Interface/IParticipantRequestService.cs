using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IParticipantRequestService
{
    Task<ActionResponseDto> CreateRequestAsync(int interviewId, CreateParticipantRequestDto dto, int fromUserId);
    Task<List<ParticipantRequestDto>> GetRequestsByInterviewAsync(int interviewId);
    Task<List<ParticipantRequestDto>> GetMyAssignedRequestsAsync(int userId);
    Task<List<ParticipantRequestDto>> GetForwardedToMeAsync(int userId);
    Task<ParticipantRequestDto?> GetByIdAsync(int reqId);
    Task<ActionResponseDto> NominateAsync(int reqId, List<int> userIds, int nominatorUserId);
    Task<ActionResponseDto> ForwardToDirectorAsync(int reqId, int directorId, string? message, int fromUserId);
    Task<ActionResponseDto> CancelAsync(int reqId, int userId);
    Task<List<SimpleUserDto>> GetDeptMembersAsync(int userId);
    Task<List<SimpleUserDto>> GetAllDeptManagersAsync();
    Task<List<SimpleUserDto>> GetAllDirectorsAsync();
}
