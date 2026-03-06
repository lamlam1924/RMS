using RMS.Entity;

namespace RMS.Repository.Interface;

/// <summary>
/// Repository quản lý File và metadata trong database
/// </summary>
public interface IMediaRepository
{
    /// <summary>Lấy loại file theo code</summary>
    Task<FileType?> GetFileTypeByCodeAsync(string code);
    
    /// <summary>Lấy loại đối tượng theo code</summary>
    Task<EntityType?> GetEntityTypeByCodeAsync(string code);
    
    /// <summary>Thêm bản ghi file mới</summary>
    Task<FileUploaded> AddFileUploadedAsync(FileUploaded fileUploaded);
    
    /// <summary>Lấy bản ghi file theo ID</summary>
    Task<FileUploaded?> GetFileUploadedByIdAsync(int id);
    
    /// <summary>Xóa bản ghi file</summary>
    Task DeleteFileUploadedAsync(FileUploaded fileUploaded);
}
