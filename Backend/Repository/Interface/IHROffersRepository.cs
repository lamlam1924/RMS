using RMS.Dto.HR;

namespace RMS.Repository.Interface;

public interface IHROffersRepository
{
    Task<List<OfferListDto>> GetOffersAsync(int? statusId = null);
    Task<List<OfferListDto>> GetAcceptedForStaffAsync();
    Task<List<OfferListDto>> GetDeclinedForStaffAsync();
    Task<List<OfferListDto>> GetAcceptedForManagerAsync();
    Task<bool> MarkAcceptedOffersSentToManagerAsync(List<int> offerIds, int userId);
    Task<List<OfferListDto>> GetOffersByIdsAsync(List<int> offerIds);
    Task<List<OfferListDto>> GetPendingOffersAsync();
    Task<List<OfferListDto>> GetApprovedOffersAsync();
    Task<List<OfferListDto>> GetEditedOffersAsync();
    Task<List<OfferListDto>> GetNegotiatingOffersAsync();
    Task<List<OfferListDto>> GetPendingHRManagerOffersAsync();
    Task<bool> SaveOfferEditHistoryAsync(int offerId, decimal salary, string? benefits, DateOnly? startDate, int userId);
    Task<List<OfferEditHistoryDto>> GetOfferEditHistoryAsync(int offerId);
    Task<bool> SubmitNegotiationToManagerAsync(int offerId, int userId);
    Task<bool> ForwardToDirectorAsync(int offerId, int userId);
    Task<OfferDetailDto?> GetOfferByIdAsync(int id);
    Task<int> CreateOfferAsync(int candidateId, int jobRequestId, decimal salary, string? benefits, DateOnly? startDate, int userId, int? applicationId = null);
    Task<OfferListDto?> GetOfferByApplicationIdAsync(int applicationId);
    Task<decimal?> GetJobRequestBudgetAsync(int jobRequestId);
    Task<bool> UpdateOfferAsync(int offerId, decimal salary, string? benefits, DateOnly? startDate, int userId);
    Task<bool> UpdateOfferStatusAsync(int offerId, int toStatusId, int userId, string? note = null);
    Task<bool> SendOfferAsync(int offerId, int userId);
    /// <summary>Lấy thông tin để gửi thông báo cho HR Staff khi ứng viên chấp nhận offer.</summary>
    Task<(string? HREmail, string CandidateName, string PositionTitle)?> GetOfferNotificationDataForHRAsync(int offerId);
    Task<List<OfferListDto>> GetOffersForCandidateAsync(int candidateId);
    Task<OfferDetailDto?> GetOfferForCandidateByIdAsync(int offerId, int candidateId);
    Task<bool> CandidateRespondAsync(int offerId, string response, string? comment, int candidateId);
    Task<bool> UpdateOfferAfterNegotiationAsync(int offerId, decimal proposedSalary, string? benefits, DateOnly? startDate, int userId);
}
