using RMS.Entity;

namespace RMS.Repository.Interface;

/// <summary>
/// Repository quản lý Yêu cầu tuyển dụng cho HR Manager
/// </summary>
public interface IHRJobRequestsRepository
{
    /// <summary>Lấy tất cả yêu cầu</summary>
    Task<List<JobRequest>> GetJobRequestsAsync();
    
    /// <summary>Lấy yêu cầu đang chờ thẩm định</summary>
    Task<List<JobRequest>> GetPendingJobRequestsAsync();
    
    /// <summary>Lấy yêu cầu theo trạng thái</summary>
    Task<List<JobRequest>> GetJobRequestsByStatusAsync(string statusCode);
    
    /// <summary>Lấy chi tiết yêu cầu</summary>
    Task<JobRequest?> GetJobRequestByIdAsync(int id);
    
    /// <summary>Lấy lịch sử trạng thái</summary>
    Task<List<StatusHistory>> GetStatusHistoryAsync(int entityId, string entityTypeCode);
    
    /// <summary>Cập nhật trạng thái</summary>
    Task<bool> UpdateStatusAsync(int id, int toStatusId, int changedBy, string? note);
    
    /// <summary>Lấy ID loại đối tượng</summary>
    Task<int> GetEntityTypeIdAsync(string code);
    
    /// <summary>Cập nhật thời gian trả về cuối</summary>
    Task<bool> UpdateLastReturnedAtAsync(int id, DateTime returnedAt);
    
    /// <summary>Lấy trạng thái theo code</summary>
    Task<Status?> GetStatusByCodeAsync(string code, int typeId);

    /// <summary>Lấy trạng thái theo ID</summary>
    Task<Status?> GetStatusByIdAsync(int statusId);

    /// <summary>Lấy URL file JD</summary>
    Task<string?> GetJdFileUrlAsync(int jobRequestId);

    /// <summary>HR phê duyệt hủy (CANCEL_PENDING → CANCELLED)</summary>
    Task<bool> ApproveCancelAsync(int id, int hrManagerId, string? note);

    /// <summary>HR từ chối hủy (CANCEL_PENDING → trạng thái trước đó)</summary>
    Task<bool> RejectCancelAsync(int id, int hrManagerId, string? note);
}
