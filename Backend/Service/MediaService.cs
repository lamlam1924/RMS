using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

/// <summary>
/// Service for file upload orchestration (business logic)
/// </summary>
public class MediaService : IMediaService
{
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IMediaRepository _repository;

    public MediaService(ICloudinaryService cloudinaryService, IMediaRepository repository)
    {
        _cloudinaryService = cloudinaryService;
        _repository = repository;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string fileTypeCode, int entityId, string entityTypeCode)
    {
        if (fileStream == null || fileStream.Length == 0)
            return string.Empty;

        // 1. Get metadata from repository
        var fileType = await _repository.GetFileTypeByCodeAsync(fileTypeCode);
        var entityType = await _repository.GetEntityTypeByCodeAsync(entityTypeCode);

        if (fileType == null || entityType == null)
        {
            throw new Exception("FileType or EntityType code is invalid.");
        }

        // 2. Upload to Cloudinary
        var folder = $"RMS/{entityTypeCode.ToLower()}/{entityId}";
        var uploadResult = await _cloudinaryService.UploadAsync(fileStream, fileName, folder);

        // 3. Save metadata to database
        var fileUploaded = new FileUploaded
        {
            FileTypeId = fileType.Id,
            EntityTypeId = entityType.Id,
            EntityId = entityId,
            StorageProvider = "Cloudinary",
            PublicId = uploadResult.PublicId,
            FileUrl = uploadResult.SecureUrl,
            UploadedAt = DateTime.Now
        };

        var savedFile = await _repository.AddFileUploadedAsync(fileUploaded);
        return savedFile.FileUrl;
    }

    public async Task<bool> DeleteFileAsync(int fileId)
    {
        var file = await _repository.GetFileUploadedByIdAsync(fileId);
        if (file == null) return false;

        // Delete from Cloudinary
        var deleted = await _cloudinaryService.DeleteAsync(file.PublicId);

        if (deleted)
        {
            await _repository.DeleteFileUploadedAsync(file);
            return true;
        }

        return false;
    }
}
