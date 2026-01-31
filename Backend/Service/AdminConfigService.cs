using RMS.Dto.Admin;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class AdminConfigService : IAdminConfigService
{
    private readonly IAdminConfigRepository _repository;

    public AdminConfigService(IAdminConfigRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<SystemConfigDto>> GetAllConfigsAsync()
    {
        return await _repository.GetAllConfigsAsync();
    }

    public async Task<SystemConfigDto?> GetConfigByKeyAsync(string key)
    {
        return await _repository.GetConfigByKeyAsync(key);
    }

    public async Task<SystemConfigDto> UpdateConfigAsync(string key, string value)
    {
        var success = await _repository.UpdateConfigAsync(key, value);
        if (!success)
        {
            throw new InvalidOperationException("Configuration key not found");
        }

        var config = await _repository.GetConfigByKeyAsync(key);
        if (config == null)
        {
            throw new InvalidOperationException("Configuration key not found");
        }

        return config;
    }

    public async Task<List<SystemConfigDto>> BulkUpdateConfigsAsync(Dictionary<string, string> configs)
    {
        await _repository.BulkUpdateConfigsAsync(configs);
        return await _repository.GetAllConfigsAsync();
    }
}
