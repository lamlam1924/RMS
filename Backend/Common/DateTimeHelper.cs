namespace RMS.Common;

/// <summary>
/// Helper xử lý thời gian theo múi giờ Việt Nam (UTC+7)
/// </summary>
public static class DateTimeHelper
{
    private static readonly TimeZoneInfo VietnamTimeZone = 
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); // UTC+7

    /// <summary>
    /// Lấy thời gian hiện tại theo múi giờ Việt Nam
    /// </summary>
    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);
    
    /// <summary>
    /// Convert UTC sang giờ Việt Nam
    /// </summary>
    public static DateTime ToVietnamTime(DateTime utcDateTime)
    {
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, VietnamTimeZone);
    }
    
    /// <summary>
    /// Convert giờ Việt Nam sang UTC (để lưu database)
    /// </summary>
    public static DateTime ToUtc(DateTime vietnamDateTime)
    {
        return TimeZoneInfo.ConvertTimeToUtc(vietnamDateTime, VietnamTimeZone);
    }
}
