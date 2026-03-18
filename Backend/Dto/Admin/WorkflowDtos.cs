namespace RMS.Dto.Admin;

// ==================== STATUS TYPE ====================
public class StatusTypeListDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string? Description { get; set; }
}

// ==================== STATUS ====================
public class StatusListDto
{
    public int Id { get; set; }
    public int StatusTypeId { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int? OrderNo { get; set; }
    public bool? IsFinal { get; set; }
}

// ==================== WORKFLOW TRANSITION ====================
public class WorkflowTransitionListDto
{
    public int Id { get; set; }
    public int StatusTypeId { get; set; }
    public int FromStatusId { get; set; }
    public int ToStatusId { get; set; }
    public int RequiredRoleId { get; set; }
    
    // Navigation properties for display
    public string? FromStatusName { get; set; }
    public string? ToStatusName { get; set; }
    public string? RequiredRoleName { get; set; }
}

public class WorkflowTransitionCreateDto
{
    public int StatusTypeId { get; set; }
    public int FromStatusId { get; set; }
    public int ToStatusId { get; set; }
    public int RequiredRoleId { get; set; }
}

public class WorkflowTransitionUpdateDto
{
    public int FromStatusId { get; set; }
    public int ToStatusId { get; set; }
    public int RequiredRoleId { get; set; }
}
