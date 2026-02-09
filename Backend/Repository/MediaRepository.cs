using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class MediaRepository : IMediaRepository
{
    private readonly RecruitmentDbContext _context;

    public MediaRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<FileType?> GetFileTypeByCodeAsync(string code)
    {
        return await _context.FileTypes.FirstOrDefaultAsync(t => t.Code == code);
    }

    public async Task<EntityType?> GetEntityTypeByCodeAsync(string code)
    {
        return await _context.EntityTypes.FirstOrDefaultAsync(t => t.Code == code);
    }

    public async Task<FileUploaded> AddFileUploadedAsync(FileUploaded fileUploaded)
    {
        _context.FileUploadeds.Add(fileUploaded);
        await _context.SaveChangesAsync();
        return fileUploaded;
    }

    public async Task<FileUploaded?> GetFileUploadedByIdAsync(int id)
    {
        return await _context.FileUploadeds.FindAsync(id);
    }

    public async Task DeleteFileUploadedAsync(FileUploaded fileUploaded)
    {
        _context.FileUploadeds.Remove(fileUploaded);
        await _context.SaveChangesAsync();
    }
}
