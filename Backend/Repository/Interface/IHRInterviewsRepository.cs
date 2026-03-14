using RMS.Dto.HR;
using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRInterviewsRepository
{
    /// <summary>Lấy toàn bộ danh sách phỏng vấn</summary>
    Task<List<InterviewListDto>> GetInterviewsAsync();

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra</summary>
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync();

    /// <summary>Lấy chi tiết một buổi phỏng vấn</summary>
    Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId);

    /// <summary>Tạo buổi phỏng vấn, tự tính RoundNo, kiểm tra xung đột lịch candidate</summary>
    Task<(int interviewId, string? conflictWarning)> CreateInterviewAsync(CreateInterviewDto dto, int userId);

    /// <summary>Cập nhật thông tin buổi phỏng vấn</summary>
    Task<bool> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto);

    /// <summary>Chốt kết quả: PASS → Application PASSED, REJECT → Application REJECTED</summary>
    Task<bool> FinalizeInterviewAsync(int interviewId, string decision, string? note, int userId);

    /// <summary>Huỷ buổi phỏng vấn</summary>
    Task<bool> CancelInterviewAsync(int interviewId, int userId);

    /// <summary>Lấy tiêu chí đánh giá theo vị trí và vòng phỏng vấn</summary>
    Task<List<EvaluationCriterion>> GetCriteriaByPositionAsync(int positionId, int roundNo);

    /// <summary>Kiểm tra user có được phân công vào buổi phỏng vấn không</summary>
    Task<bool> IsInterviewParticipantAsync(int interviewId, int userId);

    /// <summary>Kiểm tra user đã nộp feedback cho buổi phỏng vấn chưa</summary>
    Task<bool> HasFeedbackAsync(int interviewId, int userId);
}
