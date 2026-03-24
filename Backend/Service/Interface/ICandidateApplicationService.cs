using RMS.Dto.Candidate;
using RMS.Dto.Common;

namespace RMS.Service.Interface;

public interface ICandidateApplicationService
{
    /// <summary>
    /// Ứng viên nộp đơn apply vào một JobPosting, kèm upload file PDF
    /// </summary>
    Task<(bool Success, string Message, CandidateApplyResponseDto? Data)> ApplyAsync(
        int candidateId, int jobPostingId, IFormFile? cvFile);

    /// <summary>
    /// Lấy danh sách tất cả đơn ứng tuyển của candidate
    /// </summary>
    Task<List<CandidateApplicationListDto>> GetMyApplicationsAsync(int candidateId);

    /// <summary>
    /// Lấy chi tiết một đơn ứng tuyển của candidate
    /// </summary>
    Task<CandidateApplicationDetailDto?> GetMyApplicationByIdAsync(int id, int candidateId);

    /// <summary>
    /// Lấy CV snapshot theo application của candidate
    /// </summary>
    Task<ApplicationCvSnapshotDto?> GetMyApplicationCvSnapshotAsync(int id, int candidateId);

    /// <summary>
    /// Backfill CV snapshot cho các application cũ chưa snapshot
    /// </summary>
    Task<ApplicationCvSnapshotBackfillResultDto> BackfillApplicationCvSnapshotsAsync();
}
