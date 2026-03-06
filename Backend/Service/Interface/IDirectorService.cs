using RMS.Dto.Director;

namespace RMS.Service.Interface;

public interface IDirectorService
{
    /// <summary>Lấy danh sách yêu cầu tuyển dụng đang chờ Giám đốc phê duyệt.</summary>
    Task<List<JobRequestListDto>> GetPendingJobRequestsAsync();

    /// <summary>Lấy danh sách yêu cầu tuyển dụng mà Giám đốc đã xử lý (đã duyệt / từ chối / trả lại).</summary>
    Task<List<JobRequestListDto>> GetProcessedJobRequestsAsync(int directorId);

    /// <summary>Lấy thông tin chi tiết của một yêu cầu tuyển dụng theo ID.</summary>
    Task<JobRequestDetailDto?> GetJobRequestDetailAsync(int id);

    /// <summary>Giám đốc phê duyệt yêu cầu tuyển dụng.</summary>
    Task<ApprovalActionResponseDto> ApproveJobRequestAsync(JobRequestApprovalActionDto request, int directorId);

    /// <summary>Giám đốc từ chối yêu cầu tuyển dụng.</summary>
    Task<ApprovalActionResponseDto> RejectJobRequestAsync(JobRequestApprovalActionDto request, int directorId);

    /// <summary>Giám đốc trả lại yêu cầu tuyển dụng để chỉnh sửa.</summary>
    Task<ApprovalActionResponseDto> ReturnJobRequestAsync(JobRequestApprovalActionDto request, int directorId);

    /// <summary>Lấy danh sách offer đang chờ Giám đốc phê duyệt.</summary>
    Task<List<OfferListDto>> GetPendingOffersAsync();

    /// <summary>Lấy thông tin chi tiết của một offer theo ID.</summary>
    Task<OfferDetailDto?> GetOfferDetailAsync(int id);

    /// <summary>Giám đốc phê duyệt offer lương cho ứng viên.</summary>
    Task<ApprovalActionResponseDto> ApproveOfferAsync(OfferApprovalActionDto request, int directorId);

    /// <summary>Giám đốc từ chối offer lương cho ứng viên.</summary>
    Task<ApprovalActionResponseDto> RejectOfferAsync(OfferApprovalActionDto request, int directorId);
}
