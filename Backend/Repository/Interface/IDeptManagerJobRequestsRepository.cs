using RMS.Entity;

namespace RMS.Repository.Interface;

/// <summary>
/// Repository quản lý Yêu cầu tuyển dụng cho Trưởng phòng
/// </summary>
public interface IDeptManagerJobRequestsRepository
{
    /// <summary>Lấy danh sách yêu cầu của trưởng phòng</summary>
    Task<List<JobRequest>> GetJobRequestsByManagerIdAsync(int managerId);
    
    /// <summary>Lấy chi tiết yêu cầu</summary>
    Task<JobRequest?> GetJobRequestByIdAsync(int id, int managerId);
    
    /// <summary>Tạo yêu cầu mới</summary>
    Task<JobRequest> CreateJobRequestAsync(JobRequest jobRequest);
    
    /// <summary>Cập nhật yêu cầu</summary>
    Task<bool> UpdateJobRequestAsync(JobRequest jobRequest);
    
    /// <summary>Xóa yêu cầu</summary>
    Task<bool> DeleteJobRequestAsync(int id, int managerId);
    
    /// <summary>Gửi yêu cầu (chuyển trạng thái DRAFT -> SUBMITTED)</summary>
    Task<bool> SubmitJobRequestAsync(int id, int managerId);
    
    /// <summary>Mở lại yêu cầu đã bị trả về</summary>
    Task<bool> ReopenJobRequestAsync(int id, int managerId);
    
    /// <summary>Lấy trạng thái theo ID</summary>
    Task<Status?> GetStatusByIdAsync(int statusId);
    
    /// <summary>Lấy lịch sử thay đổi trạng thái</summary>
    Task<List<StatusHistory>> GetJobRequestStatusHistoryAsync(int jobRequestId);
    
    /// <summary>Lấy danh sách ứng viên của yêu cầu</summary>
    Task<List<Application>> GetApplicationsByJobRequestIdAsync(int jobRequestId, int managerId);
    
    /// <summary>Kiểm tra quyền truy cập vị trí</summary>
    Task<bool> ValidatePositionAccessAsync(int positionId, int managerId);
    
    /// <summary>Lấy danh sách vị trí của phòng ban</summary>
    Task<List<Position>> GetPositionsByManagerIdAsync(int managerId);
    
    /// <summary>Cập nhật thời gian xem cuối</summary>
    Task<bool> UpdateLastViewedAtAsync(int id, DateTime viewedAt);
    
    /// <summary>Lấy trạng thái theo code</summary>
    Task<Status?> GetStatusByCodeAsync(string code, int typeId);
    
    /// <summary>Lấy URL file JD</summary>
    Task<string?> GetJdFileUrlAsync(int jobRequestId);
}
