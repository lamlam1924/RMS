namespace RMS.Dto.Admin;

public class UserListResponseDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public string? RoleName { get; set; }
    public int? RoleId { get; set; }
    public string? DepartmentName { get; set; }
    public int? DepartmentId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UserDetailResponseDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public string? RoleName { get; set; }
    public int? RoleId { get; set; }
    public string? DepartmentName { get; set; }
    public int? DepartmentId { get; set; }
    public string AuthProvider { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
}

public class CreateUserRequestDto
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = null!;
    public int RoleId { get; set; }
    public int? DepartmentId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateUserRequestDto
{
    public string FullName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public int RoleId { get; set; }
    public int? DepartmentId { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateUserStatusDto
{
    public bool IsActive { get; set; }
}

public class ResetPasswordResponseDto
{
    public string NewPassword { get; set; } = null!;
    public string Message { get; set; } = null!;
}
