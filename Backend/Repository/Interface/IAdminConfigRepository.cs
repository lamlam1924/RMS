using RMS.Dto.Admin;

namespace RMS.Repository.Interface;

public interface IAdminConfigRepository
{
    Task<List<SystemConfigDto>> GetAllConfigsAsync();
    Task<SystemConfigDto?> GetConfigByKeyAsync(string key);
    Task<bool> UpdateConfigAsync(string key, string value);
    Task<bool> BulkUpdateConfigsAsync(Dictionary<string, string> configs);
}
