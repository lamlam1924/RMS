using RMS.Common;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;
using System.IO;

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

        // JD files are stored locally to avoid Cloudinary free-plan PDF CDN restrictions.
        if (fileTypeCode == "JOB_DESCRIPTION")
        {
            var ext = Path.GetExtension(fileName);
            var newFileName = Guid.NewGuid().ToString("N") + ext;
            var relDir = Path.Combine("uploads", "jd", entityId.ToString());
            var absDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relDir);
            Directory.CreateDirectory(absDir);

            var absPath = Path.Combine(absDir, newFileName);
            using (var writer = new FileStream(absPath, FileMode.Create, FileAccess.Write))
                await fileStream.CopyToAsync(writer);

            var localUrl = $"/uploads/jd/{entityId}/{newFileName}";
            var localFile = new FileUploaded
            {
                FileTypeId  = fileType.Id,
                EntityTypeId = entityType.Id,
                EntityId    = entityId,
                StorageProvider = "Local",
                PublicId    = $"uploads/jd/{entityId}/{newFileName}",
                FileUrl     = localUrl,
                UploadedAt  = DateTimeHelper.Now,
                IsDeleted   = false
            };
            var saved = await _repository.AddFileUploadedAsync(localFile);
            return saved.FileUrl;
        }

        // 2. All other file types: upload to Cloudinary
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
            UploadedAt = DateTimeHelper.Now,
            IsDeleted = false
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
