namespace RMS.Common;

/// <summary>
/// Dữ liệu OTP lưu trong IMemoryCache
/// </summary>
internal class OtpCacheData
{
    /// <summary>Mã OTP 6 chữ số</summary>
    public string Code { get; set; } = null!;
    
    /// <summary>Thời điểm hết hạn</summary>
    public DateTime ExpiresAt { get; set; }
    
    /// <summary>Số lần nhập sai (tối đa 5 lần)</summary>
    public int Attempts { get; set; }
}
