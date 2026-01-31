using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Director;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/director/offers")]
[Authorize(Roles = "DIRECTOR")]
public class DirectorOffersController : ControllerBase
{
    private readonly IDirectorService _service;

    public DirectorOffersController(IDirectorService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all pending offers awaiting Director approval
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<List<OfferListDto>>> GetPendingOffers()
    {
        var offers = await _service.GetPendingOffersAsync();
        return Ok(offers);
    }

    /// <summary>
    /// Get detailed information of a specific offer
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<OfferDetailDto>> GetOfferDetail(int id)
    {
        var detail = await _service.GetOfferDetailAsync(id);
        if (detail == null)
            return NotFound(new { message = "Offer not found" });

        return Ok(detail);
    }

    /// <summary>
    /// Approve an offer
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApprovalActionResponseDto>> ApproveOffer(
        int id, [FromBody] OfferApprovalActionDto request)
    {
        request.OfferId = id;
        request.Action = "APPROVED";

        var directorId = CurrentUserHelper.GetCurrentUserId(this);
        if (directorId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.ApproveOfferAsync(request, directorId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Reject an offer
    /// </summary>
    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApprovalActionResponseDto>> RejectOffer(
        int id, [FromBody] OfferApprovalActionDto request)
    {
        request.OfferId = id;
        request.Action = "REJECTED";

        var directorId = CurrentUserHelper.GetCurrentUserId(this);
        if (directorId == 0)
            return Unauthorized(new { message = "Invalid user" });

        var result = await _service.RejectOfferAsync(request, directorId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
