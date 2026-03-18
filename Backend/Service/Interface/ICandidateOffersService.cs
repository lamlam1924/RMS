using RMS.Dto.HR;

namespace RMS.Service.Interface;

public interface ICandidateOffersService
{
    Task<List<OfferListDto>> GetMyOffersAsync(int candidateId);
    Task<OfferDetailDto?> GetMyOfferByIdAsync(int offerId, int candidateId);
    Task<bool> RespondToOfferAsync(int offerId, CandidateRespondDto dto, int candidateId);
}
