using RMS.Dto.Admin;
using RMS.Entity;
using RMS.Repository;

namespace RMS.Service;

public interface IAdminWorkflowService
{
    Task<List<StatusTypeListDto>> GetAllStatusTypesAsync();
    Task<List<StatusListDto>> GetStatusesByTypeAsync(int statusTypeId);
    Task<List<WorkflowTransitionListDto>> GetTransitionsByTypeAsync(int statusTypeId);
    Task<WorkflowTransitionListDto> CreateTransitionAsync(WorkflowTransitionCreateDto dto);
    Task<WorkflowTransitionListDto> UpdateTransitionAsync(int id, WorkflowTransitionUpdateDto dto);
    Task<bool> DeleteTransitionAsync(int id);
}

public class AdminWorkflowService : IAdminWorkflowService
{
    private readonly IAdminWorkflowRepository _workflowRepository;

    public AdminWorkflowService(IAdminWorkflowRepository workflowRepository)
    {
        _workflowRepository = workflowRepository;
    }

    public async Task<List<StatusTypeListDto>> GetAllStatusTypesAsync()
    {
        var statusTypes = await _workflowRepository.GetAllStatusTypesAsync();
        
        return statusTypes.Select(st => new StatusTypeListDto
        {
            Id = st.Id,
            Code = st.Code,
            Description = st.Description
        }).ToList();
    }

    public async Task<List<StatusListDto>> GetStatusesByTypeAsync(int statusTypeId)
    {
        var statuses = await _workflowRepository.GetStatusesByTypeAsync(statusTypeId);
        
        return statuses.Select(s => new StatusListDto
        {
            Id = s.Id,
            StatusTypeId = s.StatusTypeId,
            Code = s.Code,
            Name = s.Name,
            OrderNo = s.OrderNo,
            IsFinal = s.IsFinal
        }).ToList();
    }

    public async Task<List<WorkflowTransitionListDto>> GetTransitionsByTypeAsync(int statusTypeId)
    {
        var transitions = await _workflowRepository.GetTransitionsByTypeAsync(statusTypeId);
        
        return transitions.Select(wt => new WorkflowTransitionListDto
        {
            Id = wt.Id,
            StatusTypeId = wt.StatusTypeId,
            FromStatusId = wt.FromStatusId,
            ToStatusId = wt.ToStatusId,
            RequiredRoleId = wt.RequiredRoleId,
            FromStatusName = wt.FromStatus?.Name,
            ToStatusName = wt.ToStatus?.Name,
            RequiredRoleName = wt.RequiredRole?.Name
        }).ToList();
    }

    public async Task<WorkflowTransitionListDto> CreateTransitionAsync(WorkflowTransitionCreateDto dto)
    {
        // Validate: Check if transition already exists
        var existingTransitions = await _workflowRepository.GetTransitionsByTypeAsync(dto.StatusTypeId);
        var duplicate = existingTransitions.FirstOrDefault(t => 
            t.FromStatusId == dto.FromStatusId && 
            t.ToStatusId == dto.ToStatusId &&
            t.RequiredRoleId == dto.RequiredRoleId);

        if (duplicate != null)
        {
            throw new InvalidOperationException("This transition already exists");
        }

        var transition = new WorkflowTransition
        {
            StatusTypeId = dto.StatusTypeId,
            FromStatusId = dto.FromStatusId,
            ToStatusId = dto.ToStatusId,
            RequiredRoleId = dto.RequiredRoleId
        };

        var created = await _workflowRepository.CreateTransitionAsync(transition);

        return new WorkflowTransitionListDto
        {
            Id = created.Id,
            StatusTypeId = created.StatusTypeId,
            FromStatusId = created.FromStatusId,
            ToStatusId = created.ToStatusId,
            RequiredRoleId = created.RequiredRoleId,
            FromStatusName = created.FromStatus?.Name,
            ToStatusName = created.ToStatus?.Name,
            RequiredRoleName = created.RequiredRole?.Name
        };
    }

    public async Task<WorkflowTransitionListDto> UpdateTransitionAsync(int id, WorkflowTransitionUpdateDto dto)
    {
        var existing = await _workflowRepository.GetTransitionByIdAsync(id);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Transition with ID {id} not found");
        }

        existing.FromStatusId = dto.FromStatusId;
        existing.ToStatusId = dto.ToStatusId;
        existing.RequiredRoleId = dto.RequiredRoleId;

        var updated = await _workflowRepository.UpdateTransitionAsync(existing);

        return new WorkflowTransitionListDto
        {
            Id = updated.Id,
            StatusTypeId = updated.StatusTypeId,
            FromStatusId = updated.FromStatusId,
            ToStatusId = updated.ToStatusId,
            RequiredRoleId = updated.RequiredRoleId,
            FromStatusName = updated.FromStatus?.Name,
            ToStatusName = updated.ToStatus?.Name,
            RequiredRoleName = updated.RequiredRole?.Name
        };
    }

    public async Task<bool> DeleteTransitionAsync(int id)
    {
        return await _workflowRepository.DeleteTransitionAsync(id);
    }
}
