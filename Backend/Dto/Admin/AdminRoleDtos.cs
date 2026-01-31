namespace RMS.Dto.Admin;

public class RoleListResponseDto
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; }
    public int UserCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class RoleDetailResponseDto
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; }
    public List<string> Permissions { get; set; } = new();
    public int UserCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CreateRoleRequestDto
{
    public string RoleName { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? Description { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class UpdateRoleRequestDto
{
    public string RoleName { get; set; } = null!;
    public string? Description { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class PermissionDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}
