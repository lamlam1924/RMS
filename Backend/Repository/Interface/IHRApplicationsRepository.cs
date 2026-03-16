using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRApplicationsRepository
{
    /// <param name="scopeByStaffId">Khi có giá trị: chỉ application thuộc JobRequest được gán cho staff này.</param>
    Task<List<Application>> GetApplicationsAsync(int? statusId = null, int? scopeByStaffId = null);
    Task<Application?> GetApplicationByIdAsync(int id);
    Task<string?> GetCvFileUrlAsync(int applicationId);
    Task<bool> UpdateApplicationStatusAsync(int applicationId, int toStatusId, int userId, string? note = null);
}
