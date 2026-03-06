namespace RMS.Service.Interface;

/// <summary>
/// Service quản lý Upload/Download file (kết hợp database + cloud storage)
/// </summary>
public interface IMediaService
{
    /// <summary>
    /// Upload file lên cloud và lưu metadata vào database
    /// </summary>
    /// <param name="fileStream">Dữ liệu file</param>
    /// <param name="fileName">Tên file gốc</param>
    /// <param name="fileTypeCode">Loại file (ví dụ: JOB_DESCRIPTION, CANDIDATE_CV)</param>
    /// <param name="entityId">ID của đối tượng liên quan (ví dụ: JobRequestId)</param>
    /// <param name="entityTypeCode">Loại đối tượng (ví dụ: JOB_REQUEST)</param>
    /// <returns>URL của file đã upload</returns>
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string fileTypeCode, int entityId, string entityTypeCode);

    /// <summary>
    /// Xóa file khỏi cloud và database
    /// </summary>
    /// <param name="fileId">ID bản ghi file trong database</param>
    Task<bool> DeleteFileAsync(int fileId);
}
