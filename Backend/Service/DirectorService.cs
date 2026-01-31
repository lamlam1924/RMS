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
    private readonly RecruitmentDbContext _context;

    public DirectorService(IDirectorRepository repository, IMapper mapper, RecruitmentDbContext context)
    {
        _repository = repository;
        _mapper = mapper;
        _context = context;
    }

    public async Task<List<JobRequestListDto>> GetPendingJobRequestsAsync()
    {
        var entities = await _repository.GetPendingJobRequestsAsync();
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        // Get statuses from database
        var statusIds = entities.Select(e => e.StatusId).Distinct().ToList();
        var statuses = await _context.Statuses
            .Where(s => statusIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name);

        // Set CurrentStatus from Status
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.CurrentStatus = statuses.GetValueOrDefault(entity.StatusId) ?? "Unknown";
        }

        return dtos;
    }

    public async Task<JobRequestDetailDto?> GetJobRequestDetailAsync(int id)
    {
        var entity = await _repository.GetJobRequestDetailAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<JobRequestDetailDto>(entity);
        
        // Get status from database
        var status = await _context.Statuses.FindAsync(entity.StatusId);
        dto.CurrentStatus = status?.Name ?? "Unknown";
        
        // Get and map approval history
        var history = await _repository.GetJobRequestStatusHistoryAsync(id);
        dto.ApprovalHistory = _mapper.Map<List<ApprovalHistoryDto>>(history);

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

    public async Task<List<OfferListDto>> GetPendingOffersAsync()
    {
        var entities = await _repository.GetPendingOffersAsync();
        var dtos = _mapper.Map<List<OfferListDto>>(entities);

        // Get statuses from database
        var statusIds = entities.Select(e => e.StatusId).Distinct().ToList();
        var statuses = await _context.Statuses
            .Where(s => statusIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name);

        // Set CurrentStatus from Status
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            dto.CurrentStatus = statuses.GetValueOrDefault(entity.StatusId) ?? "Unknown";
        }

        return dtos;
    }

    public async Task<OfferDetailDto?> GetOfferDetailAsync(int id)
    {
        var entity = await _repository.GetOfferDetailAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<OfferDetailDto>(entity);
        
        // Get status from database
        var status = await _context.Statuses.FindAsync(entity.StatusId);
        dto.CurrentStatus = status?.Name ?? "Unknown";
        
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
