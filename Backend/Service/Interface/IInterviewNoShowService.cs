using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Xử lý trường hợp vắng mặt (no-show) trong phỏng vấn — candidate hoặc interviewer
/// </summary>
public interface IInterviewNoShowService
{
    /// <summary>Đánh dấu buổi phỏng vấn là no-show (candidate hoặc interviewer vắng mặt)</summary>
    Task<bool> MarkAsNoShowAsync(MarkNoShowRequestDto request, int markedBy);

    /// <summary>Lấy thống kê no-show của một candidate cụ thể</summary>
    Task<CandidateNoShowStatsDto?> GetCandidateNoShowStatsAsync(int candidateId);

    /// <summary>Lấy tổng hợp thống kê no-show toàn hệ thống</summary>
    Task<NoShowStatisticsSummaryDto> GetNoShowStatisticsSummaryAsync();

    /// <summary>Kiểm tra candidate có bị blacklist do no-show quá nhiều lần không</summary>
    Task<bool> IsCandidateBlacklistedAsync(int candidateId);
}
