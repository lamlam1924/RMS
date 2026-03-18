using RMS.Dto.HR;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class CandidateOffersService : ICandidateOffersService
{
    private readonly IHROffersRepository _repository;

    public CandidateOffersService(IHROffersRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<OfferListDto>> GetMyOffersAsync(int candidateId)
    {
        return await _repository.GetOffersForCandidateAsync(candidateId);
    }

    public async Task<OfferDetailDto?> GetMyOfferByIdAsync(int offerId, int candidateId)
    {
        return await _repository.GetOfferForCandidateByIdAsync(offerId, candidateId);
    }

    public async Task<bool> RespondToOfferAsync(int offerId, CandidateRespondDto dto, int candidateId)
    {
        return await _repository.CandidateRespondAsync(offerId, dto.Response, dto.Comment, candidateId);
    }
}
