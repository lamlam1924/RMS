using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IHRApplicationsRepository
{
    Task<List<Application>> GetApplicationsAsync(int? statusId = null);
    Task<Application?> GetApplicationByIdAsync(int id);
    Task<bool> UpdateApplicationStatusAsync(int applicationId, int toStatusId, int userId, string? note = null);
}
