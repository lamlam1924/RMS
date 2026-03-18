namespace RMS.Dto.Common;

/// <summary>
/// Generic response DTO for action operations (create, update, delete, submit)
/// Used across all modules for consistent API responses
/// </summary>
public class ActionResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public string? NewStatus { get; set; }
    public object? Data { get; set; }
}
