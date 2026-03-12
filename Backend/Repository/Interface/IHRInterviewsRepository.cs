using RMS.Dto.HR;
using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRInterviewsRepository
{
    Task<List<InterviewListDto>> GetInterviewsAsync();
    Task<List<InterviewListDto>> GetUpcomingInterviewsAsync();
    Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId);

    /// <summary>Tạo interview, tự tính RoundNo, kiểm tra conflict lịch candidate</summary>
    Task<(int interviewId, string? conflictWarning)> CreateInterviewAsync(CreateInterviewDto dto, int userId);

    Task<bool> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto);

    /// <summary>HR chốt kết quả: PASS → Application PASSED, REJECT → Application REJECTED</summary>
    Task<bool> FinalizeInterviewAsync(int interviewId, string decision, string? note, int userId);

    Task<bool> CancelInterviewAsync(int interviewId, int userId);

    Task<List<EvaluationCriterion>> GetCriteriaByPositionAsync(int positionId);
}
