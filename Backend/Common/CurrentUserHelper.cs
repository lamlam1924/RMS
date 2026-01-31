using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace RMS.Common;

/// <summary>
/// Helper methods để lấy thông tin user hiện tại từ JWT claims
/// </summary>
public static class CurrentUserHelper
{
    /// <summary>
    /// Lấy User ID từ JWT token claims
    /// </summary>
    public static int GetCurrentUserId(ControllerBase controller)
    {
        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }
}
