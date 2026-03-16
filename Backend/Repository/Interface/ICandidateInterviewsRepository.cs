using RMS.Dto.Candidate;

namespace RMS.Repository.Interface;

public interface ICandidateInterviewsRepository
{
    Task<List<CandidateInterviewListDto>> GetInterviewsAsync(int candidateId);
    Task<CandidateInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int candidateId);

    /// <summary>Phản hồi lịch phỏng vấn. Khi từ chối có thể gửi declineNote để HR thương lượng/đổi lịch. changedByUserId: ghi lịch sử (thường là User.Id của candidate).</summary>
    Task<bool> RespondAsync(int interviewId, int candidateId, bool confirm, string? declineNote = null, int? changedByUserId = null);
}
