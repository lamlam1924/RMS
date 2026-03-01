using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IDirectorRepository
{
    // ==================== Yêu cầu tuyển dụng ====================

    /// <summary>Lấy danh sách yêu cầu tuyển dụng đang chờ Giám đốc phê duyệt.</summary>
    Task<List<JobRequest>> GetPendingJobRequestsAsync();

    /// <summary>Lấy danh sách yêu cầu tuyển dụng mà Giám đốc đã xử lý.</summary>
    Task<List<JobRequest>> GetProcessedJobRequestsAsync(int directorId);

    /// <summary>Lấy thông tin chi tiết của một yêu cầu tuyển dụng theo ID.</summary>
    Task<JobRequest?> GetJobRequestDetailAsync(int id);

    /// <summary>Lấy lịch sử thay đổi trạng thái của một yêu cầu tuyển dụng.</summary>
    Task<List<StatusHistory>> GetJobRequestStatusHistoryAsync(int jobRequestId);

    /// <summary>Cập nhật trạng thái yêu cầu tuyển dụng thành "Đã duyệt" trong database.</summary>
    Task<bool> ApproveJobRequestAsync(int jobRequestId, int directorId, string comment);

    /// <summary>Cập nhật trạng thái yêu cầu tuyển dụng thành "Từ chối" trong database.</summary>
    Task<bool> RejectJobRequestAsync(int jobRequestId, int directorId, string comment);

    /// <summary>Cập nhật trạng thái yêu cầu tuyển dụng thành "Trả lại" trong database.</summary>
    Task<bool> ReturnJobRequestAsync(int jobRequestId, int directorId, string comment);

    /// <summary>Lấy URL file JD (Job Description) đính kèm theo yêu cầu tuyển dụng.</summary>
    Task<string?> GetJdFileUrlAsync(int jobRequestId);

    // ==================== Offer ====================

    /// <summary>Lấy danh sách offer đang chờ Giám đốc phê duyệt.</summary>
    Task<List<Offer>> GetPendingOffersAsync();

    /// <summary>Lấy thông tin chi tiết của một offer theo ID.</summary>
    Task<Offer?> GetOfferDetailAsync(int id);

    /// <summary>Lấy lịch sử phê duyệt của một offer.</summary>
    Task<List<OfferApproval>> GetOfferApprovalHistoryAsync(int offerId);

    /// <summary>Cập nhật trạng thái offer thành "Đã duyệt" trong database.</summary>
    Task<bool> ApproveOfferAsync(int offerId, int directorId, string comment);

    /// <summary>Cập nhật trạng thái offer thành "Từ chối" trong database.</summary>
    Task<bool> RejectOfferAsync(int offerId, int directorId, string comment);

    /// <summary>Lấy tên trạng thái theo danh sách ID trạng thái.</summary>
    Task<Dictionary<int, string>> GetStatusNamesAsync(IEnumerable<int> statusIds);

    /// <summary>Lấy mã trạng thái (code) theo danh sách ID trạng thái.</summary>
    Task<Dictionary<int, string>> GetStatusCodesAsync(IEnumerable<int> statusIds);
}
