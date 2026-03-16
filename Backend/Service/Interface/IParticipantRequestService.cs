using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Quản lý luồng đề cử người tham gia phỏng vấn: tạo yêu cầu, chuyển tiếp, đề cử và huỷ
/// </summary>
public interface IParticipantRequestService
{
    /// <summary>HR Staff tạo yêu cầu đề cử người tham gia cho một buổi phỏng vấn</summary>
    Task<ActionResponseDto> CreateRequestAsync(int interviewId, CreateParticipantRequestDto dto, int fromUserId);

    /// <summary>HR gửi yêu cầu đề cử theo block (nhiều buổi) – 1 request + N ParticipantRequestInterviews</summary>
    Task<ActionResponseDto> CreateBatchRequestAsync(CreateParticipantRequestBatchDto dto, int fromUserId);

    /// <summary>Lấy danh sách yêu cầu đề cử của một buổi phỏng vấn</summary>
    Task<List<ParticipantRequestDto>> GetRequestsByInterviewAsync(int interviewId);

    /// <summary>HR Manager xem các yêu cầu được giao cho mình xử lý</summary>
    Task<List<ParticipantRequestDto>> GetMyAssignedRequestsAsync(int userId);

    /// <summary>Director xem các yêu cầu được HR Manager chuyển tiếp lên</summary>
    Task<List<ParticipantRequestDto>> GetForwardedToMeAsync(int userId);

    /// <summary>Lấy chi tiết một yêu cầu đề cử theo ID</summary>
    Task<ParticipantRequestDto?> GetByIdAsync(int reqId);

    /// <summary>Đề cử danh sách người tham gia phỏng vấn (HR Manager hoặc Director thực hiện)</summary>
    Task<ActionResponseDto> NominateAsync(int reqId, List<int> userIds, int nominatorUserId);

    /// <summary>HR Manager chuyển tiếp yêu cầu lên Director (cho vị trí cấp cao)</summary>
    Task<ActionResponseDto> ForwardToDirectorAsync(int reqId, int directorId, string? message, int fromUserId);

    /// <summary>Huỷ yêu cầu đề cử</summary>
    Task<ActionResponseDto> CancelAsync(int reqId, int userId);

    /// <summary>Lấy danh sách thành viên trong phòng ban của user (để đề cử)</summary>
    Task<List<SimpleUserDto>> GetDeptMembersAsync(int userId);

    /// <summary>Lấy danh sách tất cả trưởng phòng ban</summary>
    Task<List<SimpleUserDto>> GetAllDeptManagersAsync();

    /// <summary>Lấy danh sách tất cả Giám đốc</summary>
    Task<List<SimpleUserDto>> GetAllDirectorsAsync();
}
