using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

/// <summary>
/// Phỏng vấn dành cho Director — xử lý yêu cầu đề cử người tham gia được chuyển tiếp từ HR Manager
/// </summary>
[ApiController]
[Route("api/director/interviews")]
[Authorize(Roles = "DIRECTOR")]
public class DirectorInterviewsController : ControllerBase
{
    private readonly IParticipantRequestService _requestService;

    public DirectorInterviewsController(IParticipantRequestService requestService)
    {
        _requestService = requestService;
    }

    /// <summary>Lấy danh sách yêu cầu đề cử được HR Manager chuyển tiếp lên</summary>
    [HttpGet("participant-requests")]
    public async Task<ActionResult<List<ParticipantRequestDto>>> GetForwardedRequests()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        return Ok(await _requestService.GetForwardedToMeAsync(userId));
    }

    /// <summary>Lấy chi tiết một yêu cầu đề cử</summary>
    [HttpGet("participant-requests/{reqId}")]
    public async Task<ActionResult<ParticipantRequestDto>> GetRequestById(int reqId)
    {
        var dto = await _requestService.GetByIdAsync(reqId);
        return dto == null ? NotFound() : Ok(dto);
    }

    /// <summary>Đề cử người tham gia phỏng vấn cho vị trí cấp cao</summary>
    [HttpPost("participant-requests/{reqId}/nominate")]
    public async Task<ActionResult<ActionResponseDto>> Nominate(
        int reqId, [FromBody] NominateParticipantsDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _requestService.NominateAsync(reqId, dto.UserIds, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
