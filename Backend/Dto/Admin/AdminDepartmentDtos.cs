namespace RMS.Dto.Admin;

public class DepartmentListResponseDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = null!;
    public string? Description { get; set; }
    public string? ManagerName { get; set; }
    public int? ManagerId { get; set; }
    public bool IsActive { get; set; }
    public int EmployeeCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class DepartmentDetailResponseDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = null!;
    public string? Description { get; set; }
    public string? ManagerName { get; set; }
    public int? ManagerId { get; set; }
    public bool IsActive { get; set; }
    public int EmployeeCount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateDepartmentRequestDto
{
    public string DepartmentName { get; set; } = null!;
    public string? Description { get; set; }
    public int? ManagerId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateDepartmentRequestDto
{
    public string DepartmentName { get; set; } = null!;
    public string? Description { get; set; }
    public int? ManagerId { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateDepartmentStatusDto
{
    public bool IsActive { get; set; }
}
