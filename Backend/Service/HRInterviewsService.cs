using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HRInterviewsService : IHRInterviewsService
{
    private readonly IHRInterviewsRepository _repository;

    public HRInterviewsService(IHRInterviewsRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<InterviewListDto>> GetInterviewsAsync()
    {
        return await _repository.GetInterviewsAsync();
    }

    public async Task<List<InterviewListDto>> GetUpcomingInterviewsAsync()
    {
        return await _repository.GetUpcomingInterviewsAsync();
    }

    public async Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId)
    {
        var interviewId = await _repository.CreateInterviewAsync(
            dto.ApplicationId, dto.ScheduledAt, dto.Location, userId);

        return ResponseHelper.CreateActionResponse(interviewId, "Interview");
    }

    public async Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto, int userId)
    {
        var success = await _repository.UpdateInterviewAsync(
            interviewId, dto.ScheduledAt, dto.Location, userId);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Interview updated successfully", 
            "Failed to update interview"
        );
    }
}
