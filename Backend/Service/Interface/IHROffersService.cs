using RMS.Dto.Common;
using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface IHROffersService
{
    Task<List<OfferListDto>> GetOffersAsync();
    Task<List<OfferListDto>> GetOffersByStatusAsync(int statusId);
    Task<List<OfferListDto>> GetAcceptedForStaffAsync();
    Task<List<OfferListDto>> GetDeclinedForStaffAsync();
    Task<List<OfferListDto>> GetAcceptedForManagerAsync();
    Task<List<OfferListDto>> GetPendingOffersAsync();
    Task<List<OfferListDto>> GetApprovedOffersAsync();
    Task<List<OfferListDto>> GetEditedOffersAsync();
    Task<List<OfferListDto>> GetNegotiatingOffersAsync();
    Task<List<OfferListDto>> GetPendingHRManagerOffersAsync();
    Task<ActionResponseDto> SaveOfferInNegotiationAsync(int offerId, UpdateOfferDto dto, int userId);
    Task<ActionResponseDto> SubmitNegotiationToManagerAsync(int offerId, int userId);
    Task<ActionResponseDto> ForwardToDirectorAsync(int offerId, int userId);
    Task<OfferDetailDto?> GetOfferByIdAsync(int id);
    Task<OfferListDto?> GetOfferByApplicationIdAsync(int applicationId);
    Task<ActionResponseDto> CreateOfferAsync(CreateOfferDto dto, int userId);
    Task<ActionResponseDto> UpdateOfferAsync(int offerId, UpdateOfferDto dto, int userId);
    Task<ActionResponseDto> UpdateOfferStatusAsync(UpdateOfferStatusDto dto, int userId);
    Task<ActionResponseDto> SendOfferAsync(int offerId, int userId);
    Task<ActionResponseDto> UpdateOfferAfterNegotiationAsync(int offerId, UpdateOfferAfterNegotiationDto dto, int userId);
    /// <summary>Gửi danh sách offer đã chấp nhận cho HR Manager (chỉ HR Staff).</summary>
    Task<ActionResponseDto> SendAcceptedOffersToManagerAsync(List<int> offerIds, int userId);
    /// <summary>Gửi danh sách offer (accepted hoặc declined) cho HR Manager để báo cáo.</summary>
    Task<ActionResponseDto> SendOffersToManagerAsync(List<int> offerIds, string type, int userId);
}
