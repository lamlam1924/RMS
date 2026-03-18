namespace RMS.Dto.Common;

/// <summary>
/// DTO for Status information
/// Used to display current status with code and name
/// </summary>
public class StatusDto
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
}
