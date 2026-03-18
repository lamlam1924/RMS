using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Entity;
using RMS.Repository.Interface;

namespace RMS.Repository;

public class CandidateApplicationRepository : ICandidateApplicationRepository
{
    private readonly RecruitmentDbContext _context;

    public CandidateApplicationRepository(RecruitmentDbContext context)
    {
        _context = context;
    }

    public async Task<bool> HasAppliedAsync(int candidateId, int jobRequestId)
    {
        return await _context.Applications
            .AnyAsync(a =>
                a.Cvprofile.CandidateId == candidateId &&
                a.JobRequestId == jobRequestId &&
                a.IsDeleted == false);
    }

    public async Task<Application> CreateApplicationAsync(Application application)
    {
        _context.Applications.Add(application);
        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<List<Application>> GetApplicationsByCandidateIdAsync(int candidateId)
    {
        return await _context.Applications
            .Include(a => a.JobRequest)
                .ThenInclude(jr => jr.Position)
                    .ThenInclude(p => p.Department)
            .Include(a => a.JobRequest.JobPostings)
            .Include(a => a.Status)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvexperiences)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cveducations)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvcertificates)
            .Where(a => a.Cvprofile.CandidateId == candidateId && a.IsDeleted == false)
            .OrderByDescending(a => a.AppliedAt)
            .ToListAsync();
    }

    public async Task<Application?> GetApplicationByIdAsync(int id, int candidateId)
    {
        return await _context.Applications
            .Include(a => a.JobRequest)
                .ThenInclude(jr => jr.Position)
                    .ThenInclude(p => p.Department)
            .Include(a => a.JobRequest.JobPostings)
            .Include(a => a.Status)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvexperiences)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cveducations)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvcertificates)
            .FirstOrDefaultAsync(a =>
                a.Id == id &&
                a.Cvprofile.CandidateId == candidateId &&
                a.IsDeleted == false);
    }

    public async Task<string?> GetCvFileUrlAsync(int applicationId)
    {
        // First: check if a CV file was explicitly uploaded for this application
        var file = await _context.FileUploadeds
            .Where(f =>
                f.EntityTypeId == 3 &&
                f.FileTypeId == 1 &&
                f.EntityId == applicationId &&
                f.IsDeleted != true)
            .OrderByDescending(f => f.UploadedAt)
            .FirstOrDefaultAsync();

        if (file != null)
            return file.FileUrl;

        // Fallback: use the candidate's CV profile file URL
        var application = await _context.Applications
            .Include(a => a.Cvprofile)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.IsDeleted == false);

        return application?.Cvprofile?.CvFileUrl;
    }
}
