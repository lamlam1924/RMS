using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Dto.Director;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class DirectorService : IDirectorService
{
    private readonly IDirectorRepository _repository;
    private readonly IMapper _mapper;

    public DirectorService(IDirectorRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<List<JobRequestListDto>> GetPendingJobRequestsAsync()
    {
        var entities = await _repository.GetPendingJobRequestsAsync();
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        var statusIds = entities.Select(e => e.StatusId).Distinct();
        var statusNames = await _repository.GetStatusNamesAsync(statusIds);
        var statusCodes = await _repository.GetStatusCodesAsync(statusIds);

        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.CurrentStatus = statusNames.GetValueOrDefault(entity.StatusId) ?? "Unknown";
            dto.CurrentStatusCode = statusCodes.GetValueOrDefault(entity.StatusId) ?? "UNKNOWN";
        }

        return dtos;
    }

    public async Task<List<JobRequestListDto>> GetProcessedJobRequestsAsync(int directorId)
    {
        var entities = await _repository.GetProcessedJobRequestsAsync(directorId);
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        var statusIds = entities.Select(e => e.StatusId).Distinct();
        var statusNames = await _repository.GetStatusNamesAsync(statusIds);
        var statusCodes = await _repository.GetStatusCodesAsync(statusIds);

        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.CurrentStatus = statusNames.GetValueOrDefault(entity.StatusId) ?? "Unknown";
            dto.CurrentStatusCode = statusCodes.GetValueOrDefault(entity.StatusId) ?? "UNKNOWN";
        }

        return dtos;
    }

    public async Task<JobRequestDetailDto?> GetJobRequestDetailAsync(int id)
    {
        var entity = await _repository.GetJobRequestDetailAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<JobRequestDetailDto>(entity);
        
        // Get status names and codes
        var statusNames = await _repository.GetStatusNamesAsync(new[] { entity.StatusId });
        var statusCodes = await _repository.GetStatusCodesAsync(new[] { entity.StatusId });
        dto.CurrentStatus = statusNames.GetValueOrDefault(entity.StatusId) ?? "Unknown";
        dto.CurrentStatusCode = statusCodes.GetValueOrDefault(entity.StatusId) ?? "UNKNOWN";

        // Get and map approval history
        var history = await _repository.GetJobRequestStatusHistoryAsync(id);
        dto.ApprovalHistory = _mapper.Map<List<ApprovalHistoryDto>>(history);

        // Lấy JD Link từ repository
        dto.JdFileUrl = await _repository.GetJdFileUrlAsync(id);

        // Lấy ghi chú gần nhất từ HR (khi chuyển cho Director)
        // Trạng thái IN_REVIEW (ID 3)
        var hrForwardingHistory = history
            .Where(h => h.ToStatusId == 3 && !string.IsNullOrEmpty(h.Note))
            .OrderByDescending(h => h.ChangedAt)
            .FirstOrDefault();
        
        dto.HrNote = hrForwardingHistory?.Note;

        return dto;
    }

    public async Task<ApprovalActionResponseDto> ApproveJobRequestAsync(
        JobRequestApprovalActionDto request, int directorId)
    {
        var success = await _repository.ApproveJobRequestAsync(
            request.JobRequestId, directorId, request.Comment ?? "");

        return new ApprovalActionResponseDto
        {
            Success = success,
            Message = success ? "Job request approved successfully" : "Failed to approve job request",
            NewStatus = success ? "APPROVED" : null
        };
    }

    public async Task<ApprovalActionResponseDto> RejectJobRequestAsync(
        JobRequestApprovalActionDto request, int directorId)
    {
        var success = await _repository.RejectJobRequestAsync(
            request.JobRequestId, directorId, request.Comment ?? "");

        return new ApprovalActionResponseDto
        {
            Success = success,
            Message = success ? "Job request rejected successfully" : "Failed to reject job request",
            NewStatus = success ? "REJECTED" : null
        };
    }

    public async Task<ApprovalActionResponseDto> ReturnJobRequestAsync(
        JobRequestApprovalActionDto request, int directorId)
    {
        var success = await _repository.ReturnJobRequestAsync(
            request.JobRequestId, directorId, request.Comment ?? "");

        return new ApprovalActionResponseDto
        {
            Success = success,
            Message = success ? "Job request returned for revision successfully" : "Failed to return job request",
            NewStatus = success ? "RETURNED" : null
        };
    }

    public async Task<List<OfferListDto>> GetPendingOffersAsync()
    {
        var entities = await _repository.GetPendingOffersAsync();
        return _mapper.Map<List<OfferListDto>>(entities);
    }

    public async Task<OfferDetailDto?> GetOfferDetailAsync(int id)
    {
        var entity = await _repository.GetOfferDetailAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<OfferDetailDto>(entity);
        
        // Get and map approval history
        var history = await _repository.GetOfferApprovalHistoryAsync(id);
        dto.ApprovalHistory = _mapper.Map<List<OfferApprovalHistoryDto>>(history);

        return dto;
    }

    public async Task<ApprovalActionResponseDto> ApproveOfferAsync(
        OfferApprovalActionDto request, int directorId)
    {
        var success = await _repository.ApproveOfferAsync(
            request.OfferId, directorId, request.Comment ?? "");

        return new ApprovalActionResponseDto
        {
            Success = success,
            Message = success ? "Offer approved successfully" : "Failed to approve offer",
            NewStatus = success ? "APPROVED" : null
        };
    }

    public async Task<ApprovalActionResponseDto> RejectOfferAsync(
        OfferApprovalActionDto request, int directorId)
    {
        var success = await _repository.RejectOfferAsync(
            request.OfferId, directorId, request.Comment ?? "");

        return new ApprovalActionResponseDto
        {
            Success = success,
            Message = success ? "Offer rejected successfully" : "Failed to reject offer",
            NewStatus = success ? "REJECTED" : null
        };
    }
}
