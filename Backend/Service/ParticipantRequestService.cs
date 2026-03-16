using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class ParticipantRequestService : IParticipantRequestService
{
    private readonly IParticipantRequestRepository _repo;

    public ParticipantRequestService(IParticipantRequestRepository repo)
    {
        _repo = repo;
    }

    public async Task<ActionResponseDto> CreateRequestAsync(int interviewId, CreateParticipantRequestDto dto, int fromUserId)
    {
        if (dto.RequiredCount < 1)
            return new ActionResponseDto { Success = false, Message = "Số lượng người yêu cầu phải ít nhất là 1" };

        var created = await _repo.CreateRequestAsync(interviewId, dto, fromUserId);
        return new ActionResponseDto { Success = true, Message = "Đã gửi yêu cầu đề cử người phỏng vấn", Data = created };
    }

    public async Task<ActionResponseDto> CreateBatchRequestAsync(CreateParticipantRequestBatchDto dto, int fromUserId)
    {
        if (dto.InterviewIds == null || !dto.InterviewIds.Any())
            return new ActionResponseDto { Success = false, Message = "Vui lòng chọn ít nhất một buổi phỏng vấn" };
        if (dto.RequiredCount < 1)
            return new ActionResponseDto { Success = false, Message = "Số lượng người yêu cầu phải ít nhất là 1" };

        try
        {
            var created = await _repo.CreateBatchRequestAsync(dto, fromUserId);
            return new ActionResponseDto { Success = true, Message = "Đã gửi yêu cầu đề cử theo block", Data = created };
        }
        catch (ArgumentException ex)
        {
            return new ActionResponseDto { Success = false, Message = ex.Message };
        }
    }

    public Task<List<ParticipantRequestDto>> GetRequestsByInterviewAsync(int interviewId)
        => _repo.GetRequestsByInterviewAsync(interviewId);

    public Task<List<ParticipantRequestDto>> GetMyAssignedRequestsAsync(int userId)
        => _repo.GetAssignedRequestsAsync(userId);

    public Task<List<ParticipantRequestDto>> GetForwardedToMeAsync(int userId)
        => _repo.GetForwardedRequestsAsync(userId);

    public Task<ParticipantRequestDto?> GetByIdAsync(int reqId)
        => _repo.GetByIdAsync(reqId);

    public async Task<ActionResponseDto> NominateAsync(int reqId, List<int> userIds, int nominatorUserId)
    {
        if (!userIds.Any())
            return new ActionResponseDto { Success = false, Message = "Vui lòng chọn ít nhất một người tham gia" };

        var ok = await _repo.NominateAsync(reqId, userIds, nominatorUserId);
        return ok
            ? new ActionResponseDto { Success = true, Message = "Đã đề cử người phỏng vấn thành công" }
            : new ActionResponseDto { Success = false, Message = "Không tìm thấy yêu cầu hoặc không có quyền" };
    }

    public async Task<ActionResponseDto> ForwardToDirectorAsync(int reqId, int directorId, string? message, int fromUserId)
    {
        var ok = await _repo.ForwardToDirectorAsync(reqId, directorId, message, fromUserId);
        return ok
            ? new ActionResponseDto { Success = true, Message = "Đã chuyển tiếp yêu cầu đến Giám đốc" }
            : new ActionResponseDto { Success = false, Message = "Không tìm thấy yêu cầu hoặc không có quyền" };
    }

    public async Task<ActionResponseDto> CancelAsync(int reqId, int userId)
    {
        var ok = await _repo.CancelAsync(reqId, userId);
        return ok
            ? new ActionResponseDto { Success = true, Message = "Đã hủy yêu cầu" }
            : new ActionResponseDto { Success = false, Message = "Không tìm thấy yêu cầu hoặc không có quyền" };
    }

    public Task<List<SimpleUserDto>> GetDeptMembersAsync(int userId)
        => _repo.GetDeptMembersAsync(userId);

    public Task<List<SimpleUserDto>> GetAllDeptManagersAsync()
        => _repo.GetAllDeptManagersAsync();

    public Task<List<SimpleUserDto>> GetAllDirectorsAsync()
        => _repo.GetAllDirectorsAsync();
}
