using RMS.Common;
using RMS.Dto.Candidate;
using RMS.Dto.Common;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class CandidateInterviewsService : ICandidateInterviewsService
{
    private readonly ICandidateInterviewsRepository _repository;

    public CandidateInterviewsService(ICandidateInterviewsRepository repository)
    {
        _repository = repository;
    }

    public Task<List<CandidateInterviewListDto>> GetInterviewsAsync(int candidateId)
        => _repository.GetInterviewsAsync(candidateId);

    public Task<CandidateInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int candidateId)
        => _repository.GetInterviewDetailAsync(interviewId, candidateId);

    public async Task<ActionResponseDto> RespondAsync(int interviewId, int candidateId, RespondInterviewDto dto, int? changedByUserId = null)
    {
        var response = dto.Response?.Trim().ToUpper();
        if (response != "CONFIRM" && response != "DECLINE")
            return ResponseHelper.CreateActionResponse(false, "", "Response phải là CONFIRM hoặc DECLINE");

        var confirm = response == "CONFIRM";
        var success = await _repository.RespondAsync(interviewId, candidateId, confirm, confirm ? null : dto?.Note, changedByUserId);

        return ResponseHelper.CreateActionResponse(
            success,
            confirm ? "Đã xác nhận tham gia" : "Đã từ chối tham gia",
            "Không tìm thấy lịch phỏng vấn hoặc không thể phản hồi ở trạng thái hiện tại");
    }
}
