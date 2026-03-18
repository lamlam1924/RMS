using RMS.Dto.HR;

namespace RMS.Repository.Interface;

public interface IHROffersRepository
{
    Task<List<OfferListDto>> GetOffersAsync(int? statusId = null);
    Task<List<OfferListDto>> GetPendingOffersAsync();
    Task<List<OfferListDto>> GetApprovedOffersAsync();
    Task<OfferDetailDto?> GetOfferByIdAsync(int id);
    Task<int> CreateOfferAsync(int candidateId, int jobRequestId, decimal salary, string? benefits, DateOnly? startDate, int userId);
    Task<bool> UpdateOfferAsync(int offerId, decimal salary, string? benefits, DateOnly? startDate, int userId);
    Task<bool> UpdateOfferStatusAsync(int offerId, int toStatusId, int userId, string? note = null);
    Task<bool> SendOfferAsync(int offerId, int userId);
    Task<List<OfferListDto>> GetOffersForCandidateAsync(int candidateId);
    Task<OfferDetailDto?> GetOfferForCandidateByIdAsync(int offerId, int candidateId);
    Task<bool> CandidateRespondAsync(int offerId, string response, string? comment, int candidateId);
    Task<bool> UpdateOfferAfterNegotiationAsync(int offerId, decimal proposedSalary, string? benefits, DateOnly? startDate, int userId);
}
