using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Admin;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/admin/departments")]
[Authorize(Roles = "ADMIN")]
public class AdminDepartmentController : ControllerBase
{
    private readonly IAdminDepartmentService _service;
    private readonly ILogger<AdminDepartmentController> _logger;

    public AdminDepartmentController(IAdminDepartmentService service, ILogger<AdminDepartmentController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all departments
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllDepartments()
    {
        try
        {
            var departments = await _service.GetAllDepartmentsAsync();
            return Ok(departments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all departments");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get department by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDepartmentById(int id)
    {
        try
        {
            var department = await _service.GetDepartmentByIdAsync(id);
            if (department == null)
            {
                return NotFound(new { message = "Department not found" });
            }

            return Ok(department);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting department {DepartmentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Create new department
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequestDto dto)
    {
        try
        {
            var currentUserId = CurrentUserHelper.GetCurrentUserId(this);
            var department = await _service.CreateDepartmentAsync(dto, currentUserId);
            return CreatedAtAction(nameof(GetDepartmentById), new { id = department.DepartmentId }, department);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating department");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update department
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] UpdateDepartmentRequestDto dto)
    {
        try
        {
            var department = await _service.UpdateDepartmentAsync(id, dto);
            return Ok(department);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating department {DepartmentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete department
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(int id)
    {
        try
        {
            var currentUserId = CurrentUserHelper.GetCurrentUserId(this);
            var success = await _service.DeleteDepartmentAsync(id, currentUserId);
            
            if (!success)
            {
                return NotFound(new { message = "Department not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting department {DepartmentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update department status (activate/deactivate)
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateDepartmentStatus(int id, [FromBody] UpdateDepartmentStatusDto dto)
    {
        try
        {
            var success = await _service.UpdateDepartmentStatusAsync(id, dto.IsActive);
            
            if (!success)
            {
                return NotFound(new { message = "Department not found" });
            }

            return Ok(new { message = "Department status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating department status {DepartmentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
