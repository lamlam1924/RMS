using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.Candidate;
using RMS.Service.Interface;

namespace RMS.Controller;

/// <summary>
/// API cho candidate ứng tuyển vào job và xem đơn ứng tuyển của mình
/// </summary>
[ApiController]
[Route("api/candidate/applications")]
[Authorize(Roles = "CANDIDATE")]
public class CandidateApplicationController : ControllerBase
{
    private readonly ICandidateApplicationService _service;

    public CandidateApplicationController(ICandidateApplicationService service)
    {
        _service = service;
    }

    private int? GetCandidateId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return int.TryParse(idStr, out var id) ? id : null;
    }

    /// <summary>
    /// Ứng viên nộp đơn apply vào một JobPosting.
    /// Gửi file PDF CV (tùy chọn) qua multipart/form-data.
    /// </summary>
    [HttpPost("apply/{jobPostingId:int}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CandidateApplyResponseDto>> Apply(
        int jobPostingId,
        [FromForm] CandidateApplyRequestDto request)
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized(new { message = "Vui lòng đăng nhập với tài khoản ứng viên." });

        var (success, message, data) = await _service.ApplyAsync(candidateId.Value, jobPostingId, request.CvFile);

        if (!success)
            return BadRequest(new { message });

        return Ok(data);
    }

    /// <summary>
    /// Lấy danh sách tất cả đơn ứng tuyển của candidate đang đăng nhập
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CandidateApplicationListDto>>> GetMyApplications()
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized(new { message = "Vui lòng đăng nhập với tài khoản ứng viên." });

        var applications = await _service.GetMyApplicationsAsync(candidateId.Value);
        return Ok(applications);
    }

    /// <summary>
    /// Lấy chi tiết một đơn ứng tuyển của candidate
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CandidateApplicationDetailDto>> GetMyApplicationById(int id)
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized(new { message = "Vui lòng đăng nhập với tài khoản ứng viên." });

        var application = await _service.GetMyApplicationByIdAsync(id, candidateId.Value);
        if (application == null)
            return NotFound(new { message = "Không tìm thấy đơn ứng tuyển." });

        return Ok(application);
    }
}
