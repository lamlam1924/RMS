using RMS.Dto.Common;

namespace RMS.Service.Interface;

/// <summary>
/// Service xử lý upload file lên Cloudinary (external storage)
/// </summary>
public interface ICloudinaryService
{
    /// <summary>
    /// Upload file lên Cloudinary
    /// </summary>
    /// <param name="fileStream">Dữ liệu file</param>
    /// <param name="fileName">Tên file gốc</param>
    /// <param name="folder">Thư mục trên Cloudinary</param>
    /// <returns>Kết quả upload (bao gồm PublicId và URL)</returns>
    Task<CloudinaryUploadResultDto> UploadAsync(Stream fileStream, string fileName, string folder);

    /// <summary>
    /// Fetch raw bytes của file từ Cloudinary, dùng ExplicitAsync để mở quyền truy cập nếu cần.
    /// </summary>
    Task<byte[]> FetchFileAsync(string fileUrl, string publicId);

    /// <summary>
    /// Xóa file khỏi Cloudinary
    /// </summary>
    /// <param name="publicId">Public ID của file trên Cloudinary</param>
    /// <returns>True nếu xóa thành công</returns>
    Task<bool> DeleteAsync(string publicId);
}
