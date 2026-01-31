using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Service.Interface;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/offers")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HROffersController : ControllerBase
{
    private readonly IHROffersService _hrOffersService;

    public HROffersController(IHROffersService hrOffersService)
    {
        _hrOffersService = hrOffersService;
    }

    /// <summary>
    /// Get all offers
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<OfferListDto>>> GetOffers()
    {
        try
        {
            var offers = await _hrOffersService.GetOffersAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get pending offers (for HR Manager approval)
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<List<OfferListDto>>> GetPendingOffers()
    {
        try
        {
            var offers = await _hrOffersService.GetPendingOffersAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load pending offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get approved offers (for HR Staff to send)
    /// </summary>
    [HttpGet("approved")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult<List<OfferListDto>>> GetApprovedOffers()
    {
        try
        {
            var offers = await _hrOffersService.GetApprovedOffersAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load approved offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get offer by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<OfferDetailDto>> GetOfferById(int id)
    {
        try
        {
            var offer = await _hrOffersService.GetOfferByIdAsync(id);
            if (offer == null)
            {
                return NotFound(new { message = "Offer not found" });
            }
            return Ok(offer);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load offer", error = ex.Message });
        }
    }

    /// <summary>
    /// Create new offer
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ActionResponseDto>> CreateOffer([FromBody] CreateOfferDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.CreateOfferAsync(dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create offer", error = ex.Message });
        }
    }

    /// <summary>
    /// Update offer status (HR Manager approve/reject)
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<ActionResponseDto>> UpdateOfferStatus(
        int id, [FromBody] UpdateOfferStatusDto dto)
    {
        try
        {
            dto.OfferId = id;
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.UpdateOfferStatusAsync(dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update offer status", error = ex.Message });
        }
    }

    /// <summary>
    /// Send offer to candidate (HR Staff action)
    /// </summary>
    [HttpPut("{id}/send")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> SendOffer(int id)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.SendOfferAsync(id, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to send offer", error = ex.Message });
        }
    }
}
