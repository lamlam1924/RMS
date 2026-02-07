using AutoMapper;
using RMS.Dto.Common;
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

        // Map status directly
        for(int i = 0; i < dtos.Count; i++)
        {
             dtos[i].CurrentStatus = GetStatusName(entities[i].StatusId);
        }

        return dtos;
    }

    public async Task<List<JobRequestListDto>> GetPendingJobRequestsAsync()
    {
        var entities = await _repository.GetPendingJobRequestsAsync();
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        for(int i = 0; i < dtos.Count; i++)
        {
             dtos[i].CurrentStatus = GetStatusName(entities[i].StatusId);
        }

        return dtos;
    }

    public async Task<JobRequestDetailDto?> GetJobRequestByIdAsync(int id)
    {
        var entity = await _repository.GetJobRequestByIdAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<JobRequestDetailDto>(entity);
        
        // Use entity status as primary source
        dto.CurrentStatus = GetStatusName(entity.StatusId);

        var statusHistory = await _repository.GetStatusHistoryAsync(id, "JobRequest");
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

    private string GetStatusName(int statusId)
    {
        return statusId switch
        {
            1 => "DRAFT",
            2 => "SUBMITTED",
            3 => "IN_REVIEW",
            4 => "APPROVED",
            5 => "REJECTED",
            _ => "Unknown"
        };
    }

    public async Task<ActionResponseDto> UpdateStatusAsync(int id, int statusId, string note, int userId)
    {
        var jobRequest = await _repository.GetJobRequestByIdAsync(id);
        if (jobRequest == null) 
            return new ActionResponseDto { Success = false, Message = "Job request not found" };

        var oldStatusId = jobRequest.StatusId;
        jobRequest.StatusId = statusId;
        jobRequest.UpdatedAt = DateTime.Now;

        await _repository.UpdateJobRequestAsync(jobRequest);

        // Add history
        var history = new StatusHistory
        {
            EntityTypeId = 1, // JOB_REQUEST
            EntityId = id,
            FromStatusId = oldStatusId,
            ToStatusId = statusId,
            ChangedBy = userId,
            ChangedAt = DateTime.Now,
            Note = note
        };
        await _repository.AddStatusHistoryAsync(history);

        return new ActionResponseDto { Success = true, Message = "Status updated successfully" };
    }
}
