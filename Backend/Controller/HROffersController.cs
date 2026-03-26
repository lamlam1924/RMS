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
    /// Get offers accepted by candidates - HR Staff: chưa gửi cho Manager (status 19, SentToManagerAt null)
    /// </summary>
    [HttpGet("accepted-for-staff")]
    [Authorize(Roles = "HR_STAFF")]
    public async Task<ActionResult<List<OfferListDto>>> GetAcceptedForStaff()
    {
        try
        {
            var offers = await _hrOffersService.GetAcceptedForStaffAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load accepted offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get offers accepted by candidates - HR Manager: đã được Staff gửi (status 19, SentToManagerAt not null)
    /// </summary>
    [HttpGet("accepted-for-manager")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<List<OfferListDto>>> GetAcceptedForManager()
    {
        try
        {
            var offers = await _hrOffersService.GetAcceptedForManagerAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load accepted offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get offers declined by candidates (status DECLINED = 20)
    /// </summary>
    [HttpGet("declined")]
    public async Task<ActionResult<List<OfferListDto>>> GetDeclinedOffers()
    {
        try
        {
            // Sử dụng method mới để chỉ lấy declined offers chưa gửi cho manager
            var offers = await _hrOffersService.GetDeclinedForStaffAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load declined offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get offers pending HR Manager to forward to Director (status PENDING_HR_MANAGER = 24)
    /// </summary>
    [HttpGet("pending-hr-manager")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<List<OfferListDto>>> GetPendingHRManagerOffers()
    {
        try
        {
            var offers = await _hrOffersService.GetPendingHRManagerOffersAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get offers where candidate requested negotiation (status NEGOTIATING = 21)
    /// </summary>
    [HttpGet("negotiating")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<List<OfferListDto>>> GetNegotiatingOffers()
    {
        try
        {
            var offers = await _hrOffersService.GetNegotiatingOffersAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load negotiating offers", error = ex.Message });
        }
    }

    /// <summary>
    /// Get offers that have been edited (UpdatedAt != null) - for HR Manager overview
    /// </summary>
    [HttpGet("edited")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<List<OfferListDto>>> GetEditedOffers()
    {
        try
        {
            var offers = await _hrOffersService.GetEditedOffersAsync();
            return Ok(offers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load edited offers", error = ex.Message });
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
    /// Get offer by application ID (most recent offer for the application)
    /// </summary>
    [HttpGet("by-application/{applicationId}")]
    public async Task<ActionResult<OfferListDto>> GetOfferByApplicationId(int applicationId)
    {
        try
        {
            var offer = await _hrOffersService.GetOfferByApplicationIdAsync(applicationId);
            if (offer == null)
                return NotFound(new { message = "No offer found for this application" });
            return Ok(offer);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to load offer", error = ex.Message });
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
    /// Update offer details (salary, benefits, start date) - only when DRAFT or IN_REVIEW
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> UpdateOffer(int id, [FromBody] UpdateOfferDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.UpdateOfferAsync(id, dto, userId);
            if (result.Success)
                return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update offer", error = ex.Message });
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
    /// Submit offer for review (DRAFT -> IN_REVIEW)
    /// </summary>
    [HttpPut("{id}/submit")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> SubmitOfferForReview(int id)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var dto = new UpdateOfferStatusDto
            {
                OfferId = id,
                ToStatusId = 15,
                Note = "Submitted for review"
            };

            var result = await _hrOffersService.UpdateOfferStatusAsync(dto, userId);
            if (result.Success)
                return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to submit offer for review", error = ex.Message });
        }
    }

    /// <summary>
    /// Send offer to candidate (HR Staff/Manager)
    /// </summary>
    [HttpPut("{id}/send")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
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

    /// <summary>
    /// Send list of accepted offers to HR Manager (HR Staff/Manager)
    /// </summary>
    [HttpPost("send-accepted-to-manager")]
    [HttpPost("send-accepted-to-manager")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> SendAcceptedOffersToManager([FromBody] SendAcceptedToManagerDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.SendAcceptedOffersToManagerAsync(dto.OfferIds ?? new List<int>(), userId);
            if (result.Success)
                return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to send to HR Manager", error = ex.Message });
        }
    }

    /// <summary>
    /// Send offers (accepted or declined) to HR Manager for reporting
    /// POST api/hr/offers/send-to-manager
    /// </summary>
    [HttpPost("send-to-manager")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> SendOffersToManager([FromBody] SendOffersToManagerDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.SendOffersToManagerAsync(
                dto.OfferIds ?? new List<int>(), 
                dto.Type ?? "accepted", 
                userId
            );
            if (result.Success)
                return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to send to HR Manager", error = ex.Message });
        }
    }

    /// <summary>
    /// Save offer edits in negotiation (update + history, stay NEGOTIATING)
    /// </summary>
    [HttpPut("{id}/save-negotiation")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> SaveOfferInNegotiation(int id, [FromBody] UpdateOfferDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.SaveOfferInNegotiationAsync(id, dto, userId);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to save offer", error = ex.Message });
        }
    }

    /// <summary>
    /// HR Manager forwards offer to Director for approval (PENDING_HR_MANAGER -> IN_REVIEW)
    /// </summary>
    [HttpPut("{id}/forward-to-director")]
    [Authorize(Roles = "HR_MANAGER")]
    public async Task<ActionResult<ActionResponseDto>> ForwardToDirector(int id)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.ForwardToDirectorAsync(id, userId);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to forward to director", error = ex.Message });
        }
    }

    /// <summary>
    /// Submit negotiation offer to HR Manager (NEGOTIATING -> PENDING_HR_MANAGER)
    /// </summary>
    [HttpPut("{id}/submit-to-manager")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> SubmitNegotiationToManager(int id)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.SubmitNegotiationToManagerAsync(id, userId);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to submit to manager", error = ex.Message });
        }
    }

    /// <summary>
    /// Update offer after candidate negotiates, then resend (status must be NEGOTIATING)
    /// </summary>
    [HttpPut("{id}/negotiation")]
    [Authorize(Roles = "HR_MANAGER,HR_STAFF")]
    public async Task<ActionResult<ActionResponseDto>> UpdateAfterNegotiation(int id, [FromBody] UpdateOfferAfterNegotiationDto dto)
    {
        try
        {
            var userId = CurrentUserHelper.GetCurrentUserId(this);
            var result = await _hrOffersService.UpdateOfferAfterNegotiationAsync(id, dto, userId);
            
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update offer", error = ex.Message });
        }
    }
}
