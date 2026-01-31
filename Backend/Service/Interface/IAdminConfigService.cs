using RMS.Dto.Admin;

namespace RMS.Service.Interface;

public interface IAdminConfigService
{
    Task<List<SystemConfigDto>> GetAllConfigsAsync();
    Task<SystemConfigDto?> GetConfigByKeyAsync(string key);
    Task<SystemConfigDto> UpdateConfigAsync(string key, string value);
    Task<List<SystemConfigDto>> BulkUpdateConfigsAsync(Dictionary<string, string> configs);
}
