using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHRJobPostingsService
{
    Task<List<JobPostingListDto>> GetJobPostingsAsync();
    Task<List<JobPostingListDto>> GetDraftJobPostingsAsync();
    Task<List<JobPostingListDto>> GetMyJobPostingsAsync(int staffId);
    Task<JobPostingDetailDto?> GetJobPostingByIdAsync(int id);
    Task<ActionResponseDto> CreateJobPostingAsync(CreateJobPostingDto dto, int userId);
    Task<ActionResponseDto> UpdateJobPostingAsync(int id, UpdateJobPostingDto dto, int userId);
    Task<ActionResponseDto> PublishJobPostingAsync(int jobPostingId, int userId);
    Task<ActionResponseDto> CloseJobPostingAsync(CloseJobPostingDto dto, int userId);
    Task<ActionResponseDto> AssignStaffAsync(int jobPostingId, AssignStaffDto dto, int managerId);
    Task<List<HRStaffDto>> GetHRStaffListAsync();
}
