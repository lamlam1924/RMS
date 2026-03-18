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

    public Task<List<InterviewListDto>> GetInterviewsAsync()
        => _repository.GetInterviewsAsync();

    public Task<List<InterviewListDto>> GetUpcomingInterviewsAsync()
        => _repository.GetUpcomingInterviewsAsync();

    public Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId)
        => _repository.GetInterviewDetailAsync(interviewId);

    public async Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId)
    {
        if (dto.EndTime <= dto.StartTime)
            return ResponseHelper.CreateActionResponse(false, "", "EndTime phải sau StartTime");

        var (interviewId, conflictWarning) = await _repository.CreateInterviewAsync(dto, userId);

        if (interviewId <= 0)
            return ResponseHelper.CreateActionResponse(false, "", "Tạo interview thất bại");

        return new ActionResponseDto
        {
            Success = true,
            Message = conflictWarning != null
                ? $"Interview đã tạo (Cảnh báo: {conflictWarning})"
                : "Interview đã tạo thành công",
            Data = new { Id = interviewId, ConflictWarning = conflictWarning }
        };
    }

    public async Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto)
    {
        var success = await _repository.UpdateInterviewAsync(interviewId, dto);
        return ResponseHelper.CreateActionResponse(success, "Interview đã cập nhật", "Không tìm thấy interview");
    }

    public async Task<ActionResponseDto> FinalizeInterviewAsync(int interviewId, FinalizeInterviewDto dto, int userId)
    {
        var decision = dto.Decision.ToUpper();
        if (decision != "PASS" && decision != "REJECT")
            return ResponseHelper.CreateActionResponse(false, "", "Decision phải là PASS hoặc REJECT");

        var success = await _repository.FinalizeInterviewAsync(interviewId, decision, dto.Note, userId);
        return ResponseHelper.CreateActionResponse(success, "Kết quả đã được chốt", "Không tìm thấy interview");
    }

    public async Task<ActionResponseDto> CancelInterviewAsync(int interviewId, int userId)
    {
        var success = await _repository.CancelInterviewAsync(interviewId, userId);
        return ResponseHelper.CreateActionResponse(success, "Interview đã huỷ", "Không tìm thấy interview");
    }
}
