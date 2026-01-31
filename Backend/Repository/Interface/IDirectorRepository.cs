using RMS.Entity;

namespace RMS.Repository.Interface;

public interface IDirectorRepository
{
    // Job Requests
    Task<List<JobRequest>> GetPendingJobRequestsAsync();
    Task<JobRequest?> GetJobRequestDetailAsync(int id);
    Task<List<StatusHistory>> GetJobRequestStatusHistoryAsync(int jobRequestId);
    Task<bool> ApproveJobRequestAsync(int jobRequestId, int directorId, string comment);
    Task<bool> RejectJobRequestAsync(int jobRequestId, int directorId, string comment);
    
    // Offers
    Task<List<Offer>> GetPendingOffersAsync();
    Task<Offer?> GetOfferDetailAsync(int id);
    Task<List<OfferApproval>> GetOfferApprovalHistoryAsync(int offerId);
    Task<bool> ApproveOfferAsync(int offerId, int directorId, string comment);
    Task<bool> RejectOfferAsync(int offerId, int directorId, string comment);
}
