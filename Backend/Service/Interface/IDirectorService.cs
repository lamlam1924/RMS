using RMS.Dto.Director;

namespace RMS.Service.Interface;

public interface IDirectorService
{
    Task<List<JobRequestListDto>> GetPendingJobRequestsAsync();
    Task<JobRequestDetailDto?> GetJobRequestDetailAsync(int id);
    Task<ApprovalActionResponseDto> ApproveJobRequestAsync(JobRequestApprovalActionDto request, int directorId);
    Task<ApprovalActionResponseDto> RejectJobRequestAsync(JobRequestApprovalActionDto request, int directorId);
    
    Task<List<OfferListDto>> GetPendingOffersAsync();
    Task<OfferDetailDto?> GetOfferDetailAsync(int id);
    Task<ApprovalActionResponseDto> ApproveOfferAsync(OfferApprovalActionDto request, int directorId);
    Task<ApprovalActionResponseDto> RejectOfferAsync(OfferApprovalActionDto request, int directorId);
}
