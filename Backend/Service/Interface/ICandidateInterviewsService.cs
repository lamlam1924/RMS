using RMS.Dto.Candidate;
using RMS.Dto.Common;

namespace RMS.Service.Interface;

public interface ICandidateInterviewsService
{
    Task<List<CandidateInterviewListDto>> GetInterviewsAsync(int candidateId);
    Task<ActionResponseDto> RespondAsync(int interviewId, int candidateId, RespondInterviewDto dto);
}
