using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHROffersService
{
    Task<List<OfferListDto>> GetOffersAsync();
    Task<List<OfferListDto>> GetPendingOffersAsync();
    Task<List<OfferListDto>> GetApprovedOffersAsync();
    Task<OfferDetailDto?> GetOfferByIdAsync(int id);
    Task<ActionResponseDto> CreateOfferAsync(CreateOfferDto dto, int userId);
    Task<ActionResponseDto> UpdateOfferStatusAsync(UpdateOfferStatusDto dto, int userId);
    Task<ActionResponseDto> SendOfferAsync(int offerId, int userId);
}
