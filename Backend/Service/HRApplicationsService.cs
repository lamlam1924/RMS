using AutoMapper;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HRApplicationsService : IHRApplicationsService
{
    private readonly IHRApplicationsRepository _repository;
    private readonly IHRJobRequestsRepository _jobRequestsRepository;
    private readonly IMapper _mapper;

    public HRApplicationsService(IHRApplicationsRepository repository, IHRJobRequestsRepository jobRequestsRepository, IMapper mapper)
    {
        _repository = repository;
        _jobRequestsRepository = jobRequestsRepository;
        _mapper = mapper;
    }

    public async Task<List<ApplicationListDto>> GetApplicationsAsync(int? statusId = null, int? scopeByStaffId = null)
    {
        var entities = await _repository.GetApplicationsAsync(statusId, scopeByStaffId);
        var dtos = _mapper.Map<List<ApplicationListDto>>(entities);
        var appIds = entities.Select(e => e.Id).ToList();
        var offerRequestTimes = await _repository.GetOfferCreationRequestTimesAsync(appIds);
        var appIdsHavingOffer = await _repository.GetApplicationIdsHavingOfferAsync(appIds);

        foreach (var dto in dtos)
        {
            dto.CurrentStatus = entities.First(e => e.Id == dto.Id).Status.Name;
            offerRequestTimes.TryGetValue(dto.Id, out var requestedAt);
            var shouldRequestOffer = dto.StatusId == 12 &&
                                     !appIdsHavingOffer.Contains(dto.Id) &&
                                     requestedAt.HasValue;
            if (shouldRequestOffer)
            {
                dto.IsOfferCreationRequested = true;
                dto.OfferCreationRequestedAt = requestedAt;
            }
        }

        return dtos;
    }

    public async Task<ApplicationDetailDto?> GetApplicationByIdAsync(int id)
    {
        var entity = await _repository.GetApplicationByIdAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<ApplicationDetailDto>(entity);
        var statusHistory = await _jobRequestsRepository.GetStatusHistoryAsync(id, "Application");

        dto.CurrentStatus = entity.Status.Name;
        dto.CvUrl = await _repository.GetCvFileUrlAsync(id);
        dto.StatusHistory = _mapper.Map<List<RMS.Dto.Common.StatusHistoryDto>>(statusHistory);
        dto.ProfessionalTitle = entity.Cvprofile.ProfessionalTitle;
        dto.Summary = entity.Cvprofile.Summary;
        dto.SkillsText = entity.Cvprofile.SkillsText;
        dto.Address = entity.Cvprofile.Address;
        dto.RejectionReason = dto.StatusHistory
            .Where(h => h.ToStatusId == 13 && !string.IsNullOrWhiteSpace(h.Note))
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => h.Note)
            .FirstOrDefault();
        dto.Experiences = entity.Cvprofile.Cvexperiences
            .OrderByDescending(e => e.StartDate)
            .Select(e => new ApplicationCvExperienceDto
            {
                Id = e.Id,
                CompanyName = e.CompanyName,
                JobTitle = e.JobTitle,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                Description = e.Description
            })
            .ToList();
        dto.Educations = entity.Cvprofile.Cveducations
            .OrderByDescending(e => e.EndYear ?? e.StartYear ?? 0)
            .Select(e => new ApplicationCvEducationDto
            {
                Id = e.Id,
                SchoolName = e.SchoolName,
                Degree = e.Degree,
                Major = e.Major,
                StartYear = e.StartYear,
                EndYear = e.EndYear,
                Gpa = e.Gpa
            })
            .ToList();
        dto.Certificates = entity.Cvprofile.Cvcertificates
            .OrderByDescending(c => c.IssuedYear ?? 0)
            .Select(c => new ApplicationCvCertificateDto
            {
                Id = c.Id,
                CertificateName = c.CertificateName,
                Issuer = c.Issuer,
                IssuedYear = c.IssuedYear
            })
            .ToList();

        return dto;
    }

    public async Task<ApplicationCvSnapshotDto?> GetApplicationCvSnapshotAsync(int id)
    {
        var entity = await _repository.GetApplicationByIdAsync(id);
        if (entity == null) return null;

        var fileUrl = await _repository.GetCvFileUrlAsync(id);

        return new ApplicationCvSnapshotDto
        {
            ApplicationId = entity.Id,
            CvprofileId = entity.CvprofileId,
            AppliedAt = entity.AppliedAt,
            CvFileUrl = fileUrl,
            FullName = entity.Cvprofile.FullName,
            Email = entity.Cvprofile.Email,
            Phone = entity.Cvprofile.Phone,
            Address = entity.Cvprofile.Address,
            ProfessionalTitle = entity.Cvprofile.ProfessionalTitle,
            Summary = entity.Cvprofile.Summary,
            SkillsText = entity.Cvprofile.SkillsText,
            ReferencesText = entity.Cvprofile.ReferencesText,
            YearsOfExperience = entity.Cvprofile.YearsOfExperience,
            Experiences = entity.Cvprofile.Cvexperiences
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
            Educations = entity.Cvprofile.Cveducations
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
            Certificates = entity.Cvprofile.Cvcertificates
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

    public async Task<ActionResponseDto> UpdateApplicationStatusAsync(UpdateApplicationStatusDto dto, int userId)
    {
        if (dto.ToStatusId == 11)
        {
            return ResponseHelper.CreateActionResponse(
                false,
                "",
                "Không cập nhật thủ công sang trạng thái Interviewing. Hãy tạo lịch phỏng vấn từ hồ sơ Screening."
            );
        }

        if (dto.ToStatusId == 13 && string.IsNullOrWhiteSpace(dto.Note))
        {
            return ResponseHelper.CreateActionResponse(
                false,
                "",
                "Vui lòng nhập lý do từ chối hồ sơ."
            );
        }

        var success = await _repository.UpdateApplicationStatusAsync(
            dto.ApplicationId, dto.ToStatusId, userId, dto.Note);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Application status updated successfully", 
            "Failed to update application status"
        );
    }

    public async Task<ActionResponseDto> NotifyStaffCreateOfferAsync(int applicationId, int managerUserId)
    {
        var (success, message) = await _repository.NotifyAssignedStaffCreateOfferAsync(applicationId, managerUserId);
        return ResponseHelper.CreateActionResponse(success, message, message);
    }
}
