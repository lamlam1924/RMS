using RMS.Dto.HR;

namespace RMS.Repository.Interface;

public interface IHROffersRepository
{
    Task<List<OfferListDto>> GetOffersAsync(int? statusId = null);
    Task<List<OfferListDto>> GetPendingOffersAsync();
    Task<List<OfferListDto>> GetApprovedOffersAsync();
    Task<OfferDetailDto?> GetOfferByIdAsync(int id);
    Task<int> CreateOfferAsync(int applicationId, decimal salary, int userId);
    Task<bool> UpdateOfferStatusAsync(int offerId, int toStatusId, int userId, string? note = null);
    Task<bool> SendOfferAsync(int offerId, int userId);
}
