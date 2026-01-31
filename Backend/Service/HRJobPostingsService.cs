using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
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

    public async Task<ActionResponseDto> CreateJobPostingAsync(CreateJobPostingDto dto, int userId)
    {
        var jobPostingId = await _repository.CreateJobPostingAsync(
            dto.PositionId, dto.Quantity, dto.Description, dto.Budget ?? 0, dto.Deadline, userId);

        return ResponseHelper.CreateActionResponse(jobPostingId, "Job posting");
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
