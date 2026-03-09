using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Candidate;
using RMS.Dto.Common;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/candidate/interviews")]
[Authorize(Roles = "CANDIDATE")]
public class CandidateInterviewsController : ControllerBase
{
    private readonly ICandidateInterviewsService _service;

    public CandidateInterviewsController(ICandidateInterviewsService service)
    {
        _service = service;
    }

    /// <summary>Danh sách interview được mời (theo tất cả application của candidate)</summary>
    [HttpGet]
    public async Task<ActionResult<List<CandidateInterviewListDto>>> GetMyInterviews()
    {
        var candidateId = CurrentUserHelper.GetCurrentUserId(this);
        if (candidateId == 0) return Unauthorized();

        return Ok(await _service.GetInterviewsAsync(candidateId));
    }

    /// <summary>Xác nhận hoặc từ chối tham gia phỏng vấn (CONFIRM / DECLINE)</summary>
    [HttpPost("{id}/respond")]
    public async Task<ActionResult<ActionResponseDto>> RespondToInterview(int id, [FromBody] RespondInterviewDto dto)
    {
        var candidateId = CurrentUserHelper.GetCurrentUserId(this);
        if (candidateId == 0) return Unauthorized();

        var result = await _service.RespondAsync(id, candidateId, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
