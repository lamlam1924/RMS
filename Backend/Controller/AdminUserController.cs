using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Admin;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "ADMIN")]
public class AdminUserController : ControllerBase
{
    private readonly IAdminUserService _service;
    private readonly ILogger<AdminUserController> _logger;

    public AdminUserController(IAdminUserService service, ILogger<AdminUserController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _service.GetAllUsersAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        try
        {
            var user = await _service.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Create new user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto dto)
    {
        try
        {
            var currentUserId = CurrentUserHelper.GetCurrentUserId(this);
            var user = await _service.CreateUserAsync(dto, currentUserId);
            return CreatedAtAction(nameof(GetUserById), new { id = user.UserId }, user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequestDto dto)
    {
        try
        {
            var currentUserId = CurrentUserHelper.GetCurrentUserId(this);
            var user = await _service.UpdateUserAsync(id, dto, currentUserId);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete user
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            var currentUserId = CurrentUserHelper.GetCurrentUserId(this);
            var success = await _service.DeleteUserAsync(id, currentUserId);
            
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update user status (activate/deactivate)
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto dto)
    {
        try
        {
            var currentUserId = CurrentUserHelper.GetCurrentUserId(this);
            var success = await _service.UpdateUserStatusAsync(id, dto.IsActive, currentUserId);
            
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new { message = "User status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user status {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Reset user password
    /// </summary>
    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id)
    {
        try
        {
            var currentUserId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _service.ResetPasswordAsync(id, currentUserId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
