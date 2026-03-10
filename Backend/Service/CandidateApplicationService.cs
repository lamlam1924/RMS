using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Candidate;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class CandidateApplicationService : ICandidateApplicationService
{
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
        if (jobPosting.DeadlineDate.HasValue && jobPosting.DeadlineDate.Value < DateOnly.FromDateTime(DateTime.Now))
            return (false, "Tin tuyển dụng này đã hết hạn nộp hồ sơ.", null);

        // 4. Lấy CV Profile của candidate (lấy CV mới nhất)
        var cvProfile = await _context.Cvprofiles
            .Where(c => c.CandidateId == candidateId)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (cvProfile == null)
            return (false, "Vui lòng tạo CV profile trước khi ứng tuyển.", null);

        // 5. Kiểm tra đã apply vào JobRequest này chưa
        var alreadyApplied = await _repository.HasAppliedAsync(candidateId, jobPosting.JobRequestId);
        if (alreadyApplied)
            return (false, "Bạn đã nộp đơn vào vị trí này rồi.", null);

        // 6. Tạo Application
        var application = new Application
        {
            JobRequestId = jobPosting.JobRequestId,
            CvprofileId = cvProfile.Id,
            StatusId = 9,           // APPLIED
            Priority = 0,
            AppliedAt = DateTimeHelper.Now,
            IsDeleted = false
        };

        var created = await _repository.CreateApplicationAsync(application);

        // 7. Upload file PDF nếu có
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

        // 8. Map response
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
            AppliedAt = created.AppliedAt ?? DateTime.Now,
            CvFileUrl = cvFileUrl
        });
    }

    public async Task<List<CandidateApplicationListDto>> GetMyApplicationsAsync(int candidateId)
    {
        var applications = await _repository.GetApplicationsByCandidateIdAsync(candidateId);
        var result = new List<CandidateApplicationListDto>();

        foreach (var app in applications)
        {
            var jobTitle = app.JobRequest.JobPostings
                .OrderByDescending(jp => jp.CreatedAt)
                .FirstOrDefault()?.Title ?? app.JobRequest.Position.Title;

            var fileUrl = await _repository.GetCvFileUrlAsync(app.Id);

            result.Add(new CandidateApplicationListDto
            {
                Id = app.Id,
                JobTitle = jobTitle,
                PositionTitle = app.JobRequest.Position.Title,
                DepartmentName = app.JobRequest.Position.Department.Name,
                StatusId = app.StatusId,
                StatusName = app.Status.Name,
                AppliedAt = app.AppliedAt,
                CvFileUrl = fileUrl
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
            CandidatePhone = app.Cvprofile.Phone
        };
    }
}
