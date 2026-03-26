using RMS.Dto.DepartmentManager;
using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IDeptManagerInterviewsRepository
{
    /// <summary>Lấy danh sách phỏng vấn mà user được phân công tham gia</summary>
    Task<List<Interview>> GetInterviewsByManagerIdAsync(int managerId);

    /// <summary>Lấy danh sách phỏng vấn sắp diễn ra của user</summary>
    Task<List<Interview>> GetUpcomingInterviewsByManagerIdAsync(int managerId);

    /// <summary>Lấy chi tiết buổi phỏng vấn khi user là participant hoặc đã đề cử người tham gia (log StatusHistories).</summary>
    Task<Interview?> GetInterviewByIdAsync(int id, int managerId);

    /// <summary>Interview ids where this manager logged a nomination (đề cử).</summary>
    Task<List<int>> GetInterviewIdsNominatedByManagerAsync(int managerId);

    Task<bool> HasNominatedForInterviewAsync(int interviewId, int managerId);

    /// <summary>Load interviews by ids with same graph as list/detail (for nominator-only rows).</summary>
    Task<List<Interview>> GetInterviewsByIdsAsync(List<int> interviewIds);

    /// <summary>Kiểm tra user có được phân công vào buổi phỏng vấn không</summary>
    Task<bool> IsInterviewParticipantAsync(int interviewId, int managerId);

    /// <summary>Participant đã xác nhận tham gia (chưa từ chối) — bắt buộc để nộp feedback.</summary>
    Task<bool> ParticipantHasConfirmedParticipationAsync(int interviewId, int userId);

    /// <summary>Ghi nhận xác nhận hoặc từ chối tham gia của interviewer. Khi từ chối có thể gửi declineNote để HR thương lượng/đổi lịch.</summary>
    Task<bool> RespondToParticipationAsync(int interviewId, int userId, bool confirm, string? declineNote = null);

    /// <summary>Lấy feedback của interviewer cho một buổi phỏng vấn</summary>
    Task<InterviewFeedback?> GetFeedbackByInterviewerAsync(int interviewId, int interviewerId);

    /// <summary>Tạo bản ghi feedback mới</summary>
    Task<InterviewFeedback> CreateFeedbackAsync(InterviewFeedback feedback);

    /// <summary>Lưu điểm đánh giá theo từng tiêu chí</summary>
    Task<bool> AddInterviewScoresAsync(List<InterviewScore> scores);

    /// <summary>Cập nhật trạng thái hồ sơ ứng tuyển</summary>
    Task<bool> UpdateApplicationStatusAsync(int applicationId, int statusId, int updatedBy, string? comment);

    /// <summary>Lấy tiêu chí đánh giá theo vị trí và vòng phỏng vấn</summary>
    Task<List<EvaluationCriterion>> GetEvaluationCriteriaByPositionAsync(int positionId, int roundNo);

    /// <summary>Lấy tóm tắt các vòng phỏng vấn trước của một hồ sơ</summary>
    Task<List<PreviousRoundSummaryDto>> GetPreviousRoundsAsync(int applicationId, int currentRoundNo);
}
