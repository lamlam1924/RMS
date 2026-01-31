using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HROffersService : IHROffersService
{
    private readonly IHROffersRepository _repository;

    public HROffersService(IHROffersRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<OfferListDto>> GetOffersAsync()
    {
        return await _repository.GetOffersAsync();
    }

    public async Task<List<OfferListDto>> GetPendingOffersAsync()
    {
        return await _repository.GetPendingOffersAsync();
    }

    public async Task<List<OfferListDto>> GetApprovedOffersAsync()
    {
        return await _repository.GetApprovedOffersAsync();
    }

    public async Task<OfferDetailDto?> GetOfferByIdAsync(int id)
    {
        return await _repository.GetOfferByIdAsync(id);
    }

    public async Task<ActionResponseDto> CreateOfferAsync(CreateOfferDto dto, int userId)
    {
        var offerId = await _repository.CreateOfferAsync(
            dto.ApplicationId, dto.Salary, userId);

        return ResponseHelper.CreateActionResponse(offerId, "Offer");
    }

    public async Task<ActionResponseDto> UpdateOfferStatusAsync(UpdateOfferStatusDto dto, int userId)
    {
        var success = await _repository.UpdateOfferStatusAsync(dto.OfferId, dto.ToStatusId, userId, dto.Note);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Offer status updated successfully", 
            "Failed to update offer status"
        );
    }

    public async Task<ActionResponseDto> SendOfferAsync(int offerId, int userId)
    {
        var success = await _repository.SendOfferAsync(offerId, userId);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Offer sent successfully", 
            "Failed to send offer"
        );
    }
}
