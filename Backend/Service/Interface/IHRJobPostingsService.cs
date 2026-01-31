using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRJobPostingsService
{
    Task<List<JobPostingListDto>> GetJobPostingsAsync();
    Task<List<JobPostingListDto>> GetDraftJobPostingsAsync();
    Task<ActionResponseDto> CreateJobPostingAsync(CreateJobPostingDto dto, int userId);
    Task<ActionResponseDto> PublishJobPostingAsync(int jobPostingId, int userId);
    Task<ActionResponseDto> CloseJobPostingAsync(CloseJobPostingDto dto, int userId);
}
