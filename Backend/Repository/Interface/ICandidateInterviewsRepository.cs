using RMS.Dto.Candidate;

namespace RMS.Repository.Interface;

public interface ICandidateInterviewsRepository
{
    Task<List<CandidateInterviewListDto>> GetInterviewsAsync(int candidateId);
    Task<CandidateInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int candidateId);

    /// <summary>Phản hồi lịch phỏng vấn. Trả về false nếu không tìm thấy hoặc status không hợp lệ.</summary>
    Task<bool> RespondAsync(int interviewId, int candidateId, bool confirm);
}
