using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.Admin;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/admin/roles")]
[Authorize(Roles = "ADMIN")]
public class AdminRoleController : ControllerBase
{
    private readonly IAdminRoleService _service;
    private readonly ILogger<AdminRoleController> _logger;

    public AdminRoleController(IAdminRoleService service, ILogger<AdminRoleController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all roles
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllRoles()
    {
        try
        {
            var roles = await _service.GetAllRolesAsync();
            return Ok(roles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all roles");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get role by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoleById(int id)
    {
        try
        {
            var role = await _service.GetRoleByIdAsync(id);
            if (role == null)
            {
                return NotFound(new { message = "Role not found" });
            }

            return Ok(role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role {RoleId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Create new role
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequestDto dto)
    {
        try
        {
            var role = await _service.CreateRoleAsync(dto);
            return CreatedAtAction(nameof(GetRoleById), new { id = role.RoleId }, role);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update role
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequestDto dto)
    {
        try
        {
            var role = await _service.UpdateRoleAsync(id, dto);
            return Ok(role);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role {RoleId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete role
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(int id)
    {
        try
        {
            var success = await _service.DeleteRoleAsync(id);
            
            if (!success)
            {
                return NotFound(new { message = "Role not found" });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {RoleId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get all available permissions
    /// </summary>
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        try
        {
            var permissions = await _service.GetPermissionsAsync();
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permissions");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
