using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HRJobPostingsService : IHRJobPostingsService
{
    private readonly IHRJobPostingsRepository _repository;

    public HRJobPostingsService(IHRJobPostingsRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<JobPostingListDto>> GetJobPostingsAsync()
    {
        return await _repository.GetJobPostingsAsync();
    }

    public async Task<List<JobPostingListDto>> GetDraftJobPostingsAsync()
    {
        return await _repository.GetDraftJobPostingsAsync();
    }

    public async Task<JobPostingDetailDto?> GetJobPostingByIdAsync(int id)
    {
        var jp = await _repository.GetJobPostingByIdAsync(id);
        if (jp == null) return null;

        return new JobPostingDetailDto
        {
            Id = jp.Id,
            Title = jp.Title,
            PositionTitle = jp.JobRequest.Position.Title,
            DepartmentName = jp.JobRequest.Position.Department.Name,
            Quantity = jp.JobRequest.Quantity,
            StatusId = jp.StatusId,
            CurrentStatus = jp.Status.Name,
            CreatedAt = jp.CreatedAt ?? DateTimeHelper.Now,
            PublishedAt = jp.UpdatedAt,
            JobRequestId = jp.JobRequestId,
            Description = jp.Description,
            Requirements = jp.Requirements,
            Benefits = jp.Benefits,
            SalaryMin = jp.SalaryMin,
            SalaryMax = jp.SalaryMax,
            Location = jp.Location,
            Deadline = jp.DeadlineDate.HasValue ? jp.DeadlineDate.Value.ToDateTime(TimeOnly.MinValue) : null
        };
    }

    public async Task<ActionResponseDto> CreateJobPostingAsync(CreateJobPostingDto dto, int userId)
    {
        var jobPosting = new JobPosting
        {
            JobRequestId = dto.JobRequestId,
            Title = dto.Title,
            Description = dto.Description,
            Requirements = dto.Requirements,
            Benefits = dto.Benefits,
            SalaryMin = dto.SalaryMin,
            SalaryMax = dto.SalaryMax,
            Location = dto.Location,
            DeadlineDate = dto.Deadline.HasValue ? DateOnly.FromDateTime(dto.Deadline.Value) : null,
            StatusId = 6, // Draft
            CreatedAt = DateTimeHelper.Now,
            CreatedBy = userId,
            IsDeleted = false
        };

        var jobPostingId = await _repository.CreateJobPostingAsync(jobPosting);

        return ResponseHelper.CreateActionResponse(jobPostingId, "Job posting");
    }

    public async Task<ActionResponseDto> UpdateJobPostingAsync(int id, UpdateJobPostingDto dto, int userId)
    {
        var jobPosting = await _repository.GetJobPostingByIdAsync(id);
        if (jobPosting == null)
        {
            return ResponseHelper.CreateActionResponse(false, "", "Job posting not found");
        }

        if (jobPosting.StatusId != 6) // Check if DRAFT
        {
            return ResponseHelper.CreateActionResponse(false, "", "Only draft job postings can be updated");
        }

        jobPosting.Title = dto.Title;
        jobPosting.Description = dto.Description;
        jobPosting.Requirements = dto.Requirements;
        jobPosting.Benefits = dto.Benefits;
        jobPosting.SalaryMin = dto.SalaryMin;
        jobPosting.SalaryMax = dto.SalaryMax;
        jobPosting.Location = dto.Location;
        jobPosting.DeadlineDate = dto.Deadline.HasValue ? DateOnly.FromDateTime(dto.Deadline.Value) : null;
        jobPosting.UpdatedAt = DateTimeHelper.Now;
        jobPosting.UpdatedBy = userId;

        var success = await _repository.UpdateJobPostingAsync(jobPosting);

        return ResponseHelper.CreateActionResponse(
            success,
            "Job posting updated successfully",
            "Failed to update job posting"
        );
    }

    public async Task<ActionResponseDto> PublishJobPostingAsync(int jobPostingId, int userId)
    {
        var success = await _repository.PublishJobPostingAsync(jobPostingId, userId);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Job posting published successfully", 
            "Failed to publish job posting"
        );
    }

    public async Task<ActionResponseDto> CloseJobPostingAsync(CloseJobPostingDto dto, int userId)
    {
        var success = await _repository.CloseJobPostingAsync(dto.JobPostingId, dto.Reason, userId);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Job posting closed successfully", 
            "Failed to close job posting"
        );
    }
}
