using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Candidate;
using RMS.Dto.Common;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class CandidateApplicationService : ICandidateApplicationService
{
    private const string ApplicationSnapshotSource = "APPLICATION_SNAPSHOT";

    private readonly ICandidateApplicationRepository _repository;
    private readonly IMediaService _mediaService;
    private readonly RecruitmentDbContext _context;

    public CandidateApplicationService(
        ICandidateApplicationRepository repository,
        IMediaService mediaService,
        RecruitmentDbContext context)
    {
        _repository = repository;
        _mediaService = mediaService;
        _context = context;
    }

    public async Task<(bool Success, string Message, CandidateApplyResponseDto? Data)> ApplyAsync(
        int candidateId, int jobPostingId, IFormFile? cvFile)
    {
        // 1. Tìm JobPosting
        var jobPosting = await _context.JobPostings
            .Include(jp => jp.JobRequest)
                .ThenInclude(jr => jr.Position)
                    .ThenInclude(p => p.Department)
            .FirstOrDefaultAsync(jp => jp.Id == jobPostingId && jp.IsDeleted == false);

        if (jobPosting == null)
            return (false, "Tin tuyển dụng không tồn tại.", null);

        // 2. Kiểm tra JobPosting còn PUBLISHED (StatusId = 7)
        if (jobPosting.StatusId != 7)
            return (false, "Tin tuyển dụng này đã đóng hoặc chưa được công khai.", null);

        // 3. Kiểm tra deadline
        if (!jobPosting.DeadlineDate.HasValue)
            return (false, "Tin tuyển dụng chưa cấu hình hạn nộp hồ sơ.", null);

        if (jobPosting.DeadlineDate.Value < DateOnly.FromDateTime(DateTimeHelper.Now))
            return (false, "Tin tuyển dụng này đã hết hạn nộp hồ sơ.", null);

        // 4. Lấy CV Profile của candidate (lấy CV đang dùng cho hồ sơ cá nhân, không lấy snapshot)
        var cvProfile = await _context.Cvprofiles
            .Include(c => c.Cvexperiences)
            .Include(c => c.Cveducations)
            .Include(c => c.Cvcertificates)
            .Where(c => c.CandidateId == candidateId && c.Source != ApplicationSnapshotSource)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (cvProfile == null)
            return (false, "Vui lòng tạo CV profile trước khi ứng tuyển.", null);

        // 5. Kiểm tra đã apply vào JobRequest này chưa
        var alreadyApplied = await _repository.HasAppliedAsync(candidateId, jobPosting.JobRequestId);
        if (alreadyApplied)
            return (false, "Bạn đã nộp đơn vào vị trí này rồi.", null);

        // 6. Snapshot CV tại thời điểm apply để dữ liệu đơn không bị thay đổi theo hồ sơ cá nhân.
        var cvSnapshot = await CreateCvSnapshotAsync(cvProfile);

        // 7. Tạo Application
        var application = new Application
        {
            JobRequestId = jobPosting.JobRequestId,
            CvprofileId = cvSnapshot.Id,
            StatusId = 9,           // APPLIED
            Priority = 0,
            AppliedAt = DateTimeHelper.Now,
            IsDeleted = false
        };

        var created = await _repository.CreateApplicationAsync(application);

        // 8. Upload file PDF nếu có
        string? cvFileUrl = null;
        if (cvFile != null && cvFile.Length > 0)
        {
            var allowedTypes = new[] { "application/pdf" };
            if (!allowedTypes.Contains(cvFile.ContentType.ToLower()))
                return (false, "Chỉ chấp nhận file PDF.", null);

            using var stream = cvFile.OpenReadStream();
            cvFileUrl = await _mediaService.UploadFileAsync(
                stream,
                cvFile.FileName,
                "CV_PDF",
                created.Id,
                "APPLICATION"
            );
        }

        // 9. Map response
        var jobTitle = jobPosting.Title;
        var positionTitle = jobPosting.JobRequest.Position.Title;
        var departmentName = jobPosting.JobRequest.Position.Department.Name;

        return (true, "Nộp đơn ứng tuyển thành công.", new CandidateApplyResponseDto
        {
            ApplicationId = created.Id,
            JobTitle = jobTitle,
            PositionTitle = positionTitle,
            DepartmentName = departmentName,
            Status = "APPLIED",
            AppliedAt = created.AppliedAt ?? DateTimeHelper.Now,
            CvFileUrl = cvFileUrl
        });
    }

    private async Task<Cvprofile> CreateCvSnapshotAsync(Cvprofile sourceProfile)
    {
        var snapshot = new Cvprofile
        {
            CandidateId = sourceProfile.CandidateId,
            FullName = sourceProfile.FullName,
            Email = sourceProfile.Email,
            Phone = sourceProfile.Phone,
            Summary = sourceProfile.Summary,
            YearsOfExperience = sourceProfile.YearsOfExperience,
            CvFileUrl = sourceProfile.CvFileUrl,
            Address = sourceProfile.Address,
            ProfessionalTitle = sourceProfile.ProfessionalTitle,
            SkillsText = sourceProfile.SkillsText,
            ReferencesText = sourceProfile.ReferencesText,
            Source = ApplicationSnapshotSource,
            CreatedAt = DateTimeHelper.Now
        };

        _context.Cvprofiles.Add(snapshot);
        await _context.SaveChangesAsync();

        if (sourceProfile.Cvexperiences.Count > 0)
        {
            var experiences = sourceProfile.Cvexperiences.Select(e => new Cvexperience
            {
                CvprofileId = snapshot.Id,
                CompanyName = e.CompanyName,
                JobTitle = e.JobTitle,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                Description = e.Description,
                Location = e.Location
            });
            _context.Cvexperiences.AddRange(experiences);
        }

        if (sourceProfile.Cveducations.Count > 0)
        {
            var educations = sourceProfile.Cveducations.Select(e => new Cveducation
            {
                CvprofileId = snapshot.Id,
                SchoolName = e.SchoolName,
                Degree = e.Degree,
                Major = e.Major,
                StartYear = e.StartYear,
                EndYear = e.EndYear,
                Gpa = e.Gpa,
                Location = e.Location
            });
            _context.Cveducations.AddRange(educations);
        }

        if (sourceProfile.Cvcertificates.Count > 0)
        {
            var certificates = sourceProfile.Cvcertificates.Select(c => new Cvcertificate
            {
                CvprofileId = snapshot.Id,
                CertificateName = c.CertificateName,
                Issuer = c.Issuer,
                IssuedYear = c.IssuedYear
            });
            _context.Cvcertificates.AddRange(certificates);
        }

        await _context.SaveChangesAsync();
        return snapshot;
    }

    public async Task<ApplicationCvSnapshotBackfillResultDto> BackfillApplicationCvSnapshotsAsync()
    {
        var applications = await _context.Applications
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvexperiences)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cveducations)
            .Include(a => a.Cvprofile)
                .ThenInclude(cv => cv.Cvcertificates)
            .Where(a => a.IsDeleted == false && a.Cvprofile.Source != ApplicationSnapshotSource)
            .OrderBy(a => a.Id)
            .ToListAsync();

        var migrated = 0;
        await using var tx = await _context.Database.BeginTransactionAsync();

        foreach (var application in applications)
        {
            var snapshot = await CreateCvSnapshotAsync(application.Cvprofile);
            application.CvprofileId = snapshot.Id;
            application.UpdatedAt = DateTimeHelper.Now;
            migrated++;
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return new ApplicationCvSnapshotBackfillResultDto
        {
            TotalApplicationsScanned = applications.Count,
            MigratedApplications = migrated
        };
    }

    public async Task<List<CandidateApplicationListDto>> GetMyApplicationsAsync(int candidateId)
    {
        var applications = await _repository.GetApplicationsByCandidateIdAsync(candidateId);
        var result = new List<CandidateApplicationListDto>();
        var appIds = applications.Select(a => a.Id).ToList();
        var rejectionNotes = await _context.StatusHistories
            .Where(h => h.EntityTypeId == 3 && h.ToStatusId == 13 && appIds.Contains(h.EntityId))
            .OrderByDescending(h => h.ChangedAt)
            .GroupBy(h => h.EntityId)
            .Select(g => new
            {
                ApplicationId = g.Key,
                Note = g.Select(x => x.Note).FirstOrDefault()
            })
            .ToDictionaryAsync(x => x.ApplicationId, x => x.Note);

        foreach (var app in applications)
        {
            var jobTitle = app.JobRequest.JobPostings
                .OrderByDescending(jp => jp.CreatedAt)
                .FirstOrDefault()?.Title ?? app.JobRequest.Position.Title;

            var fileUrl = await _repository.GetCvFileUrlAsync(app.Id);
            rejectionNotes.TryGetValue(app.Id, out var rejectionReason);

            result.Add(new CandidateApplicationListDto
            {
                Id = app.Id,
                JobRequestId = app.JobRequestId,
                JobTitle = jobTitle,
                PositionTitle = app.JobRequest.Position.Title,
                DepartmentName = app.JobRequest.Position.Department.Name,
                Location = app.JobRequest.JobPostings
                    .OrderByDescending(jp => jp.CreatedAt)
                    .FirstOrDefault()?.Location,
                SalaryMin = app.JobRequest.JobPostings
                    .OrderByDescending(jp => jp.CreatedAt)
                    .FirstOrDefault()?.SalaryMin,
                SalaryMax = app.JobRequest.JobPostings
                    .OrderByDescending(jp => jp.CreatedAt)
                    .FirstOrDefault()?.SalaryMax,
                StatusId = app.StatusId,
                StatusName = app.Status.Name,
                AppliedAt = app.AppliedAt,
                CvFileUrl = fileUrl,
                ProfessionalTitle = app.Cvprofile.ProfessionalTitle,
                Summary = app.Cvprofile.Summary,
                YearsOfExperience = app.Cvprofile.YearsOfExperience,
                SkillsText = app.Cvprofile.SkillsText,
                ExperienceCount = app.Cvprofile.Cvexperiences.Count,
                EducationCount = app.Cvprofile.Cveducations.Count,
                CertificateCount = app.Cvprofile.Cvcertificates.Count,
                RejectionReason = rejectionReason
            });
        }

        return result;
    }

    public async Task<CandidateApplicationDetailDto?> GetMyApplicationByIdAsync(int id, int candidateId)
    {
        var app = await _repository.GetApplicationByIdAsync(id, candidateId);
        if (app == null) return null;

        var jobPosting = app.JobRequest.JobPostings
            .OrderByDescending(jp => jp.CreatedAt)
            .FirstOrDefault();

        var fileUrl = await _repository.GetCvFileUrlAsync(app.Id);

        return new CandidateApplicationDetailDto
        {
            Id = app.Id,
            JobRequestId = app.JobRequestId,
            JobTitle = jobPosting?.Title ?? app.JobRequest.Position.Title,
            PositionTitle = app.JobRequest.Position.Title,
            DepartmentName = app.JobRequest.Position.Department.Name,
            StatusId = app.StatusId,
            StatusName = app.Status.Name,
            AppliedAt = app.AppliedAt,
            CvFileUrl = fileUrl,
            JobDescription = jobPosting?.Description,
            JobRequirements = jobPosting?.Requirements,
            Location = jobPosting?.Location,
            SalaryMin = jobPosting?.SalaryMin,
            SalaryMax = jobPosting?.SalaryMax,
            CandidateName = app.Cvprofile.FullName,
            CandidateEmail = app.Cvprofile.Email,
            CandidatePhone = app.Cvprofile.Phone,
            Address = app.Cvprofile.Address,
            ProfessionalTitle = app.Cvprofile.ProfessionalTitle,
            Summary = app.Cvprofile.Summary,
            YearsOfExperience = app.Cvprofile.YearsOfExperience,
            SkillsText = app.Cvprofile.SkillsText,
            ExperienceCount = app.Cvprofile.Cvexperiences.Count,
            EducationCount = app.Cvprofile.Cveducations.Count,
            CertificateCount = app.Cvprofile.Cvcertificates.Count,
            RejectionReason = await _context.StatusHistories
                .Where(h => h.EntityTypeId == 3 && h.EntityId == app.Id && h.ToStatusId == 13)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => h.Note)
                .FirstOrDefaultAsync(),
            Experiences = app.Cvprofile.Cvexperiences
                .OrderByDescending(e => e.StartDate)
                .Select(e => new CandidateApplicationExperienceDto
                {
                    Id = e.Id,
                    CompanyName = e.CompanyName,
                    JobTitle = e.JobTitle,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate,
                    Description = e.Description
                })
                .ToList(),
            Educations = app.Cvprofile.Cveducations
                .OrderByDescending(e => e.EndYear ?? e.StartYear ?? 0)
                .Select(e => new CandidateApplicationEducationDto
                {
                    Id = e.Id,
                    SchoolName = e.SchoolName,
                    Degree = e.Degree,
                    Major = e.Major,
                    StartYear = e.StartYear,
                    EndYear = e.EndYear,
                    Gpa = e.Gpa
                })
                .ToList(),
            Certificates = app.Cvprofile.Cvcertificates
                .OrderByDescending(c => c.IssuedYear ?? 0)
                .Select(c => new CandidateApplicationCertificateDto
                {
                    Id = c.Id,
                    CertificateName = c.CertificateName,
                    Issuer = c.Issuer,
                    IssuedYear = c.IssuedYear
                })
                .ToList()
        };
    }

    public async Task<ApplicationCvSnapshotDto?> GetMyApplicationCvSnapshotAsync(int id, int candidateId)
    {
        var app = await _repository.GetApplicationByIdAsync(id, candidateId);
        if (app == null)
            return null;

        var fileUrl = await _repository.GetCvFileUrlAsync(app.Id);

        return new ApplicationCvSnapshotDto
        {
            ApplicationId = app.Id,
            CvprofileId = app.CvprofileId,
            AppliedAt = app.AppliedAt,
            CvFileUrl = fileUrl,
            FullName = app.Cvprofile.FullName,
            Email = app.Cvprofile.Email,
            Phone = app.Cvprofile.Phone,
            Address = app.Cvprofile.Address,
            ProfessionalTitle = app.Cvprofile.ProfessionalTitle,
            Summary = app.Cvprofile.Summary,
            SkillsText = app.Cvprofile.SkillsText,
            ReferencesText = app.Cvprofile.ReferencesText,
            YearsOfExperience = app.Cvprofile.YearsOfExperience,
            Experiences = app.Cvprofile.Cvexperiences
                .OrderByDescending(e => e.StartDate)
                .Select(e => new ApplicationCvSnapshotExperienceDto
                {
                    Id = e.Id,
                    CompanyName = e.CompanyName,
                    JobTitle = e.JobTitle,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate,
                    Description = e.Description
                })
                .ToList(),
            Educations = app.Cvprofile.Cveducations
                .OrderByDescending(e => e.EndYear ?? e.StartYear ?? 0)
                .Select(e => new ApplicationCvSnapshotEducationDto
                {
                    Id = e.Id,
                    SchoolName = e.SchoolName,
                    Degree = e.Degree,
                    Major = e.Major,
                    StartYear = e.StartYear,
                    EndYear = e.EndYear,
                    Gpa = e.Gpa
                })
                .ToList(),
            Certificates = app.Cvprofile.Cvcertificates
                .OrderByDescending(c => c.IssuedYear ?? 0)
                .Select(c => new ApplicationCvSnapshotCertificateDto
                {
                    Id = c.Id,
                    CertificateName = c.CertificateName,
                    Issuer = c.Issuer,
                    IssuedYear = c.IssuedYear
                })
                .ToList()
        };
    }
}
