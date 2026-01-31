using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Admin;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class AdminConfigRepository : IAdminConfigRepository
{
    private readonly RecruitmentDbContext _context;
    // For now, we'll use in-memory storage since there's no SystemConfig table
    // You can create a SystemConfig entity and table later
    private static Dictionary<string, string> _configs = new()
    {
        { "systemName", "Recruitment Management System" },
        { "systemEmail", "system@company.com" },
        { "systemPhone", "" },
        { "systemAddress", "" },
        { "smtpHost", "" },
        { "smtpPort", "587" },
        { "smtpUsername", "" },
        { "smtpPassword", "" },
        { "smtpEnableSSL", "true" },
        { "maxFileUploadSize", "10" },
        { "allowedFileTypes", "pdf,doc,docx,jpg,png" },
        { "sessionTimeout", "30" },
        { "passwordMinLength", "8" },
        { "passwordRequireSpecialChar", "true" },
        { "jobPostExpireDays", "30" },
        { "maxApplicationsPerJob", "100" },
        { "autoRejectAfterDays", "90" },
        { "enableEmailNotifications", "true" },
        { "enableSMSNotifications", "false" },
        { "notifyOnNewApplication", "true" },
        { "notifyOnInterviewSchedule", "true" }
    };

    public AdminConfigRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public Task<List<SystemConfigDto>> GetAllConfigsAsync()
    {
        var configs = _configs.Select(c => new SystemConfigDto
        {
            Key = c.Key,
            Value = c.Value,
            Description = null
        }).ToList();

        return Task.FromResult(configs);
    }

    public Task<SystemConfigDto?> GetConfigByKeyAsync(string key)
    {
        if (_configs.TryGetValue(key, out var value))
        {
            return Task.FromResult<SystemConfigDto?>(new SystemConfigDto
            {
                Key = key,
                Value = value,
                Description = null
            });
        }

        return Task.FromResult<SystemConfigDto?>(null);
    }

    public Task<bool> UpdateConfigAsync(string key, string value)
    {
        if (_configs.ContainsKey(key))
        {
            _configs[key] = value;
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    public Task<bool> BulkUpdateConfigsAsync(Dictionary<string, string> configs)
    {
        foreach (var config in configs)
        {
            if (_configs.ContainsKey(config.Key))
            {
                _configs[config.Key] = config.Value;
            }
        }

        return Task.FromResult(true);
    }
}
