using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using RMS.Dto.Common;
using RMS.Service.Interface;

namespace RMS.Service;

/// <summary>
/// Service for Cloudinary external file storage operations
/// </summary>
public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary? _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"];
        var apiKey = configuration["Cloudinary:ApiKey"];
        var apiSecret = configuration["Cloudinary:ApiSecret"];

        if (!string.IsNullOrEmpty(cloudName) && !string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(apiSecret))
        {
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }
        else
        {
            _cloudinary = null;
        }
    }

    public async Task<CloudinaryUploadResultDto> UploadAsync(Stream fileStream, string fileName, string folder)
    {
        if (_cloudinary == null)
        {
            throw new InvalidOperationException("Cloudinary has not been configured. Please add Cloudinary settings to appsettings.json");
        }

        var uploadParams = new RawUploadParams()
        {
            File = new FileDescription(fileName, fileStream),
            Folder = folder,
            AccessMode = "public"
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        if (uploadResult.Error != null)
        {
            throw new Exception($"Cloudinary Upload Error: {uploadResult.Error.Message}");
        }

        return new CloudinaryUploadResultDto
        {
            PublicId = uploadResult.PublicId,
            SecureUrl = uploadResult.SecureUrl.ToString()
        };
    }

    public async Task<bool> DeleteAsync(string publicId)
    {
        if (_cloudinary == null)
        {
            throw new InvalidOperationException("Cloudinary has not been configured. Please add Cloudinary settings to appsettings.json");
        }

        var deletionParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deletionParams);

        return result.Result == "ok";
    }

    public async Task<byte[]> FetchFileAsync(string fileUrl, string publicId)
    {
        using var httpClient = new System.Net.Http.HttpClient();

        // 1st attempt: direct public URL
        var response = await httpClient.GetAsync(fileUrl);

        if (response.IsSuccessStatusCode)
            return await response.Content.ReadAsByteArrayAsync();

        throw new Exception($"Không thể tải file từ Cloudinary. Status: {(int)response.StatusCode}");
    }
}