using RMS.Dto.Common;

namespace RMS.Common;

/// <summary>
/// Helper methods để tạo response DTOs
/// </summary>
public static class ResponseHelper
{
    /// <summary>
    /// Tạo ActionResponseDto từ kết quả operation
    /// </summary>
    public static ActionResponseDto CreateActionResponse(bool success, string successMessage, string failureMessage, object? data = null)
    {
        return new ActionResponseDto
        {
            Success = success,
            Message = success ? successMessage : failureMessage,
            Data = data
        };
    }

    /// <summary>
    /// Tạo ActionResponseDto cho create operation
    /// </summary>
    public static ActionResponseDto CreateActionResponse(int id, string entityName)
    {
        var success = id > 0;
        return new ActionResponseDto
        {
            Success = success,
            Message = success ? $"{entityName} created successfully" : $"Failed to create {entityName}",
            Data = success ? new { Id = id } : null
        };
    }

    public static ActionResponseDto Success(string message, object? data = null)
        => new ActionResponseDto { Success = true, Message = message, Data = data };

    public static ActionResponseDto Error(string message)
        => new ActionResponseDto { Success = false, Message = message };
}
