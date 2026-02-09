using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;

namespace RMS.Service.Interface;

/// <summary>
/// Service quản lý Yêu cầu tuyển dụng cho Trưởng phòng
/// </summary>
public interface IDeptManagerJobRequestsService
{
    /// <summary>Lấy danh sách yêu cầu tuyển dụng của trưởng phòng</summary>
    Task<List<DeptManagerJobRequestListDto>> GetJobRequestsAsync(int managerId);
    
    /// <summary>Lấy chi tiết yêu cầu tuyển dụng</summary>
    Task<DeptManagerJobRequestDetailDto?> GetJobRequestDetailAsync(int id, int managerId);
    
    /// <summary>Tạo yêu cầu tuyển dụng mới</summary>
    Task<ActionResponseDto> CreateJobRequestAsync(CreateJobRequestDto request, int managerId);
    
    /// <summary>Cập nhật yêu cầu tuyển dụng</summary>
    Task<ActionResponseDto> UpdateJobRequestAsync(int id, UpdateJobRequestDto request, int managerId);
    
    /// <summary>Gửi yêu cầu tuyển dụng lên HR</summary>
    Task<ActionResponseDto> SubmitJobRequestAsync(int id, int managerId);
    
    /// <summary>Xóa yêu cầu tuyển dụng (chỉ draft)</summary>
    Task<ActionResponseDto> DeleteJobRequestAsync(int id, int managerId);
    
    /// <summary>Lấy danh sách ứng viên theo yêu cầu tuyển dụng</summary>
    Task<List<ApplicationSummaryDto>> GetApplicationsByJobRequestAsync(int jobRequestId, int managerId);
    
    /// <summary>Lấy danh sách vị trí của phòng ban</summary>
    Task<List<PositionDto>> GetPositionsAsync(int managerId);
    
    /// <summary>Mở lại yêu cầu đã bị trả về để chỉnh sửa</summary>
    Task<ActionResponseDto> ReopenReturnedRequestAsync(int id, int managerId);
}
