using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Admin;
using RMS.Entity;

namespace RMS.Repository;

public interface IAdminWorkflowRepository
{
    Task<List<StatusType>> GetAllStatusTypesAsync();
    Task<List<Status>> GetStatusesByTypeAsync(int statusTypeId);
    Task<List<WorkflowTransition>> GetTransitionsByTypeAsync(int statusTypeId);
    Task<WorkflowTransition?> GetTransitionByIdAsync(int id);
    Task<WorkflowTransition> CreateTransitionAsync(WorkflowTransition transition);
    Task<WorkflowTransition> UpdateTransitionAsync(WorkflowTransition transition);
    Task<bool> DeleteTransitionAsync(int id);
}

public class AdminWorkflowRepository : IAdminWorkflowRepository
{
    private readonly RecruitmentDbContext _context;

    public AdminWorkflowRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<StatusType>> GetAllStatusTypesAsync()
    {
        return await _context.StatusTypes
            .OrderBy(st => st.Id)
            .ToListAsync();
    }

    public async Task<List<Status>> GetStatusesByTypeAsync(int statusTypeId)
    {
        return await _context.Statuses
            .Where(s => s.StatusTypeId == statusTypeId)
            .OrderBy(s => s.OrderNo)
            .ToListAsync();
    }

    public async Task<List<WorkflowTransition>> GetTransitionsByTypeAsync(int statusTypeId)
    {
        return await _context.WorkflowTransitions
            .Include(wt => wt.FromStatus)
            .Include(wt => wt.ToStatus)
            .Include(wt => wt.RequiredRole)
            .Where(wt => wt.StatusTypeId == statusTypeId)
            .ToListAsync();
    }

    public async Task<WorkflowTransition?> GetTransitionByIdAsync(int id)
    {
        return await _context.WorkflowTransitions
            .Include(wt => wt.FromStatus)
            .Include(wt => wt.ToStatus)
            .Include(wt => wt.RequiredRole)
            .FirstOrDefaultAsync(wt => wt.Id == id);
    }

    public async Task<WorkflowTransition> CreateTransitionAsync(WorkflowTransition transition)
    {
        _context.WorkflowTransitions.Add(transition);
        await _context.SaveChangesAsync();
        
        // Reload with navigation properties
        return (await GetTransitionByIdAsync(transition.Id))!;
    }

    public async Task<WorkflowTransition> UpdateTransitionAsync(WorkflowTransition transition)
    {
        _context.WorkflowTransitions.Update(transition);
        await _context.SaveChangesAsync();
        
        // Reload with navigation properties
        return (await GetTransitionByIdAsync(transition.Id))!;
    }

    public async Task<bool> DeleteTransitionAsync(int id)
    {
        var transition = await _context.WorkflowTransitions.FindAsync(id);
        if (transition == null) return false;

        _context.WorkflowTransitions.Remove(transition);
        await _context.SaveChangesAsync();
        return true;
    }
}
