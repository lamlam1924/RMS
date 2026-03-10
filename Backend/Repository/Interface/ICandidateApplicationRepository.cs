using RMS.Entity;

namespace RMS.Repository.Interface;

public interface ICandidateApplicationRepository
{
    /// <summary>
    /// Kiểm tra candidate đã apply vào JobRequest này chưa
    /// </summary>
    Task<bool> HasAppliedAsync(int candidateId, int jobRequestId);

    /// <summary>
    /// Tạo Application mới
    /// </summary>
    Task<Application> CreateApplicationAsync(Application application);

    /// <summary>
    /// Lấy danh sách Application của candidate
    /// </summary>
    Task<List<Application>> GetApplicationsByCandidateIdAsync(int candidateId);

    /// <summary>
    /// Lấy chi tiết Application (chỉ trả về nếu thuộc về candidateId)
    /// </summary>
    Task<Application?> GetApplicationByIdAsync(int id, int candidateId);

    /// <summary>
    /// Lấy URL file PDF CV đã upload cho một Application
    /// </summary>
    Task<string?> GetCvFileUrlAsync(int applicationId);
}
