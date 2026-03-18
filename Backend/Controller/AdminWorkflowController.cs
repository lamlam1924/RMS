using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.Admin;
using RMS.Service;

namespace RMS.Controller;

[ApiController]
[Route("api/admin/workflow")]
[Authorize(Roles = "ADMIN")]
public class AdminWorkflowController : ControllerBase
{
    private readonly IAdminWorkflowService _workflowService;

    public AdminWorkflowController(IAdminWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    /// <summary>
    /// Get all status types
    /// GET /api/admin/workflow/status-types
    /// </summary>
    [HttpGet("status-types")]
    public async Task<ActionResult<List<StatusTypeListDto>>> GetAllStatusTypes()
    {
        var result = await _workflowService.GetAllStatusTypesAsync();
        return Ok(result);
    }

    /// <summary>
    /// Get statuses by status type
    /// GET /api/admin/workflow/status-types/{typeId}/statuses
    /// </summary>
    [HttpGet("status-types/{typeId}/statuses")]
    public async Task<ActionResult<List<StatusListDto>>> GetStatusesByType(int typeId)
    {
        var result = await _workflowService.GetStatusesByTypeAsync(typeId);
        return Ok(result);
    }

    /// <summary>
    /// Get transitions by status type
    /// GET /api/admin/workflow/status-types/{typeId}/transitions
    /// </summary>
    [HttpGet("status-types/{typeId}/transitions")]
    public async Task<ActionResult<List<WorkflowTransitionListDto>>> GetTransitionsByType(int typeId)
    {
        var result = await _workflowService.GetTransitionsByTypeAsync(typeId);
        return Ok(result);
    }

    /// <summary>
    /// Create a new workflow transition
    /// POST /api/admin/workflow/transitions
    /// </summary>
    [HttpPost("transitions")]
    public async Task<ActionResult<WorkflowTransitionListDto>> CreateTransition([FromBody] WorkflowTransitionCreateDto dto)
    {
        try
        {
            var result = await _workflowService.CreateTransitionAsync(dto);
            return CreatedAtAction(nameof(CreateTransition), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Update a workflow transition
    /// PUT /api/admin/workflow/transitions/{id}
    /// </summary>
    [HttpPut("transitions/{id}")]
    public async Task<ActionResult<WorkflowTransitionListDto>> UpdateTransition(int id, [FromBody] WorkflowTransitionUpdateDto dto)
    {
        try
        {
            var result = await _workflowService.UpdateTransitionAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Delete a workflow transition
    /// DELETE /api/admin/workflow/transitions/{id}
    /// </summary>
    [HttpDelete("transitions/{id}")]
    public async Task<IActionResult> DeleteTransition(int id)
    {
        var result = await _workflowService.DeleteTransitionAsync(id);
        if (!result)
        {
            return NotFound($"Transition with ID {id} not found");
        }
        return NoContent();
    }
}
