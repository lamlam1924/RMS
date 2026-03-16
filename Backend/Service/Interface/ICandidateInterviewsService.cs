using RMS.Dto.Candidate;
using RMS.Dto.Common;

namespace RMS.Service.Interface;

/// <summary>
/// Xem lịch phỏng vấn và phản hồi lời mời từ phía candidate
/// </summary>
public interface ICandidateInterviewsService
{
    /// <summary>Lấy danh sách phỏng vấn của candidate (theo tất cả hồ sơ ứng tuyển)</summary>
    Task<List<CandidateInterviewListDto>> GetInterviewsAsync(int candidateId);

    /// <summary>Lấy chi tiết buổi phỏng vấn (chỉ khi candidate được mời)</summary>
    Task<CandidateInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int candidateId);

    /// <summary>Xác nhận hoặc từ chối tham gia phỏng vấn (CONFIRM / DECLINE). changedByUserId dùng để ghi lịch sử.</summary>
    Task<ActionResponseDto> RespondAsync(int interviewId, int candidateId, RespondInterviewDto dto, int? changedByUserId = null);
}
