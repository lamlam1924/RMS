using Microsoft.Extensions.Configuration;
using RMS.Dto.HR;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class CandidateOffersService : ICandidateOffersService
{
    private readonly IHROffersRepository _repository;
    private readonly IInterviewEmailService _interviewEmailService;
    private readonly IConfiguration _configuration;

    public CandidateOffersService(
        IHROffersRepository repository,
        IInterviewEmailService interviewEmailService,
        IConfiguration configuration)
    {
        _repository = repository;
        _interviewEmailService = interviewEmailService;
        _configuration = configuration;
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
        var success = await _repository.CandidateRespondAsync(offerId, dto.Response, dto.Comment, candidateId);
        if (!success) return false;

        // Khi ứng viên chấp nhận (ACCEPT), gửi email thông báo cho HR Staff được gán
        if (string.Equals(dto.Response, "ACCEPT", StringComparison.OrdinalIgnoreCase))
        {
            var notificationData = await _repository.GetOfferNotificationDataForHRAsync(offerId);
            if (notificationData.HasValue && !string.IsNullOrEmpty(notificationData.Value.HREmail))
            {
                var (hrEmail, candidateName, positionTitle) = notificationData.Value;
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var offerDetailLink = $"{frontendUrl}/staff/hr-manager/offers/{offerId}";

                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _interviewEmailService.SendOfferAcceptedNotificationToHRAsync(new OfferAcceptedNotificationData
                        {
                            HREmail = hrEmail,
                            CandidateName = candidateName,
                            PositionTitle = positionTitle,
                            OfferDetailLink = offerDetailLink
                        });
                    }
                    catch
                    {
                        // Log đã xử lý trong InterviewEmailService; không làm fail request
                    }
                });
            }
        }

        return true;
    }
}
