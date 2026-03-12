using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/candidate/offers")]
[Authorize(Roles = "CANDIDATE")]
public class CandidateOffersController : ControllerBase
{
    private readonly ICandidateOffersService _service;

    public CandidateOffersController(ICandidateOffersService service)
    {
        _service = service;
    }

    private int? GetCandidateId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(idStr, out var id) ? id : null;
    }

    /// <summary>
    /// Get all offers for the logged-in candidate
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<OfferListDto>>> GetMyOffers()
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized();

        try
        {
            var offers = await _service.GetMyOffersAsync(candidateId.Value);
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get offer by ID (must belong to the candidate)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<OfferDetailDto>> GetMyOfferById(int id)
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized();

        try
        {
            var offer = await _service.GetMyOfferByIdAsync(id, candidateId.Value);
            if (offer == null)
                return NotFound(new { message = "Offer not found" });
            return Ok(offer);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load offer", error = ex.Message });
        }
    }

    /// <summary>
    /// Respond to offer: ACCEPT, NEGOTIATE, or REJECT
    /// </summary>
    [HttpPut("{id}/respond")]
    public async Task<ActionResult> RespondToOffer(int id, [FromBody] CandidateRespondDto dto)
    {
        var candidateId = GetCandidateId();
        if (candidateId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Response))
            return BadRequest(new { message = "Response is required (ACCEPT, NEGOTIATE, or REJECT)" });

        try
        {
            var success = await _service.RespondToOfferAsync(id, dto, candidateId.Value);
            if (!success)
                return BadRequest(new { message = "Failed to respond. Offer may not exist or may not be in APPROVED/SENT/NEGOTIATING status." });
            return Ok(new { message = "Response recorded successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to respond to offer", error = ex.Message });
        }
    }
}
