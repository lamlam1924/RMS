using AutoMapper;
using RMS.Dto.Common;
using RMS.Dto.HR;
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

        return dto;
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
