namespace RMS.Dto.Common;

/// <summary>
/// Common DTO for Position - used across multiple modules
/// </summary>
public class PositionDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public int DepartmentId { get; set; }
    public required string DepartmentName { get; set; }
}
