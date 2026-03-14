using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Tổng hợp kết quả một vòng phỏng vấn: số feedback, điểm trung bình, phân bổ recommendation
/// </summary>
public interface IInterviewRoundSummaryService
{
    /// <summary>Xây dựng snapshot tổng hợp kết quả của một vòng phỏng vấn</summary>
    Task<InterviewRoundSummarySnapshot> BuildSummaryAsync(int interviewId);
}
