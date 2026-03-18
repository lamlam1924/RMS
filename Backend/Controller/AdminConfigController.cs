using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.Admin;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/admin/config")]
[Authorize(Roles = "ADMIN")]
public class AdminConfigController : ControllerBase
{
    private readonly IAdminConfigService _service;
    private readonly ILogger<AdminConfigController> _logger;

    public AdminConfigController(IAdminConfigService service, ILogger<AdminConfigController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all system configurations
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllConfigs()
    {
        try
        {
            var configs = await _service.GetAllConfigsAsync();
            return Ok(configs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all configs");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get configuration by key
    /// </summary>
    [HttpGet("{key}")]
    public async Task<IActionResult> GetConfigByKey(string key)
    {
        try
        {
            var config = await _service.GetConfigByKeyAsync(key);
            if (config == null)
            {
                return NotFound(new { message = "Configuration not found" });
            }

            return Ok(config);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting config {Key}", key);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update configuration
    /// </summary>
    [HttpPut("{key}")]
    public async Task<IActionResult> UpdateConfig(string key, [FromBody] UpdateConfigRequestDto dto)
    {
        try
        {
            var config = await _service.UpdateConfigAsync(key, dto.Value);
            return Ok(config);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating config {Key}", key);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Bulk update configurations
    /// </summary>
    [HttpPut("bulk")]
    public async Task<IActionResult> BulkUpdateConfigs([FromBody] BulkUpdateConfigRequestDto dto)
    {
        try
        {
            var configs = await _service.BulkUpdateConfigsAsync(dto.Configs);
            return Ok(configs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk updating configs");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
