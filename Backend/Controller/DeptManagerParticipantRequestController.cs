using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/dept-manager/participant-requests")]
[Authorize(Roles = "DEPARTMENT_MANAGER")]
public class DeptManagerParticipantRequestController : ControllerBase
{
    private readonly IParticipantRequestService _service;

    public DeptManagerParticipantRequestController(IParticipantRequestService service)
    {
        _service = service;
    }

    /// <summary>Trưởng phòng xem các yêu cầu đề cử được giao cho mình</summary>
    [HttpGet]
    public async Task<ActionResult<List<ParticipantRequestDto>>> GetMyAssignedRequests()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        return Ok(await _service.GetMyAssignedRequestsAsync(userId));
    }

    /// <summary>Xem chi tiết một yêu cầu đề cử</summary>
    [HttpGet("{reqId}")]
    public async Task<ActionResult<ParticipantRequestDto>> GetById(int reqId)
    {
        var dto = await _service.GetByIdAsync(reqId);
        return dto == null ? NotFound() : Ok(dto);
    }

    /// <summary>Lấy danh sách thành viên phòng ban để đề cử</summary>
    [HttpGet("team-members")]
    public async Task<ActionResult<List<SimpleUserDto>>> GetTeamMembers()
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        return Ok(await _service.GetDeptMembersAsync(userId));
    }

    /// <summary>Trưởng phòng đề cử người tham gia phỏng vấn</summary>
    [HttpPost("{reqId}/nominate")]
    public async Task<ActionResult<ActionResponseDto>> Nominate(
        int reqId, [FromBody] NominateParticipantsDto dto)
    {
        var userId = CurrentUserHelper.GetCurrentUserId(this);
        var result = await _service.NominateAsync(reqId, dto.UserIds, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
