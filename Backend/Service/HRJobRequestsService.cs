using AutoMapper;
using RMS.Data;
using RMS.Dto.HR;
using RMS.Dto.Common;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HRJobRequestsService : IHRJobRequestsService
{
    private readonly IHRJobRequestsRepository _repository;

    private readonly IMapper _mapper;

    public HRJobRequestsService(IHRJobRequestsRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<List<JobRequestListDto>> GetJobRequestsAsync()
    {
        var entities = await _repository.GetJobRequestsAsync();
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            var status = await _repository.GetStatusByIdAsync(entity.StatusId);
            dto.CurrentStatus = status?.Name ?? "Unknown";
            if (status != null)
                dto.Status = _mapper.Map<StatusDto>(status);
        }

        return dtos;
    }

    public async Task<List<JobRequestListDto>> GetPendingJobRequestsAsync()
    {
        var entities = await _repository.GetPendingJobRequestsAsync();
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            var status = await _repository.GetStatusByIdAsync(entity.StatusId);
            dto.CurrentStatus = status?.Name ?? "Unknown";
            if (status != null)
                dto.Status = _mapper.Map<StatusDto>(status);
        }

        return dtos;
    }

    public async Task<List<JobRequestListDto>> GetJobRequestsByStatusAsync(string statusCode)
    {
        var entities = await _repository.GetJobRequestsByStatusAsync(statusCode);
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            var status = await _repository.GetStatusByIdAsync(entity.StatusId);
            dto.CurrentStatus = status?.Name ?? "Unknown";
            if (status != null)
                dto.Status = _mapper.Map<StatusDto>(status);
        }

        return dtos;
    }

    public async Task<JobRequestDetailDto?> GetJobRequestByIdAsync(int id)
    {
        var entity = await _repository.GetJobRequestByIdAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<JobRequestDetailDto>(entity);
        var statusHistory = await _repository.GetStatusHistoryAsync(id, "JOB_REQUEST");
        
        // Map status history
        dto.StatusHistory = _mapper.Map<List<StatusHistoryDto>>(statusHistory);
        
        // Set current status from entity.StatusId (authoritative source)
        var currentStatus = await _repository.GetStatusByIdAsync(entity.StatusId);
        dto.CurrentStatus = currentStatus?.Name ?? "Unknown";
        if (currentStatus != null)
            dto.Status = _mapper.Map<StatusDto>(currentStatus);

        // Lấy JD Link
        dto.JdFileUrl = await _repository.GetJdFileUrlAsync(id);

        return dto;
    }

    public async Task<bool> ForwardToDirectorAsync(int id, string? note, int hrManagerId)
    {
        // Guard: only SUBMITTED jobs can be forwarded to Director
        var jobRequest = await _repository.GetJobRequestByIdAsync(id);
        if (jobRequest == null) return false;

        var currentStatus = await _repository.GetStatusByIdAsync(jobRequest.StatusId);
        if (currentStatus?.Code != "SUBMITTED") return false;

        var inReviewStatus = await _repository.GetStatusByCodeAsync("IN_REVIEW", 1);
        if (inReviewStatus == null) return false;

        return await _repository.UpdateStatusAsync(id, inReviewStatus.Id, hrManagerId, note);
    }

    public async Task<bool> ReturnToDeptManagerAsync(int id, string? reason, int hrManagerId)
    {
        // Guard: only SUBMITTED or IN_REVIEW jobs can be returned
        var jobRequest = await _repository.GetJobRequestByIdAsync(id);
        if (jobRequest == null) return false;

        var currentStatus = await _repository.GetStatusByIdAsync(jobRequest.StatusId);
        if (currentStatus?.Code != "SUBMITTED" && currentStatus?.Code != "IN_REVIEW") return false;

        var returnedStatus = await _repository.GetStatusByCodeAsync("RETURNED", 1);
        if (returnedStatus == null) return false;

        var success = await _repository.UpdateStatusAsync(id, returnedStatus.Id, hrManagerId, reason);

        if (success)
        {
            await _repository.UpdateLastReturnedAtAsync(id, DateTime.Now);
        }
        return success;
    }

    public async Task<bool> ApproveCancelAsync(int id, string? note, int hrManagerId)
    {
        return await _repository.ApproveCancelAsync(id, hrManagerId, note);
    }

    public async Task<bool> RejectCancelAsync(int id, string? note, int hrManagerId)
    {
        return await _repository.RejectCancelAsync(id, hrManagerId, note);
    }
}
