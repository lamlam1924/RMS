using RMS.Dto.HR;

namespace RMS.Service.Interface;

/// <summary>
/// Service quản lý Yêu cầu tuyển dụng cho HR Manager
/// </summary>
public interface IHRJobRequestsService
{
    /// <summary>Lấy tất cả yêu cầu tuyển dụng</summary>
    Task<List<JobRequestListDto>> GetJobRequestsAsync();
    
    /// <summary>Lấy yêu cầu đang chờ thẩm định</summary>
    Task<List<JobRequestListDto>> GetPendingJobRequestsAsync();
    
    /// <summary>Lấy yêu cầu theo trạng thái</summary>
    Task<List<JobRequestListDto>> GetJobRequestsByStatusAsync(string statusCode);
    
    /// <summary>Lấy chi tiết yêu cầu tuyển dụng</summary>
    Task<JobRequestDetailDto?> GetJobRequestByIdAsync(int id);
    
    /// <summary>Chuyển yêu cầu lên Giám đốc</summary>
    Task<bool> ForwardToDirectorAsync(int id, string? note, int hrManagerId);
    
    /// <summary>Trả yêu cầu về cho Trưởng phòng chỉnh sửa</summary>
    Task<bool> ReturnToDeptManagerAsync(int id, string? reason, int hrManagerId);
}
