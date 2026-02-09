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
            var statusHistory = await _repository.GetStatusHistoryAsync(dto.Id, "JOB_REQUEST");
            var currentStatus = statusHistory.FirstOrDefault()?.ToStatus;
            dto.CurrentStatus = currentStatus?.Name ?? "Unknown";
            if (currentStatus != null)
            {
                dto.Status = _mapper.Map<StatusDto>(currentStatus);
            }
        }

        return dtos;
    }

    public async Task<List<JobRequestListDto>> GetPendingJobRequestsAsync()
    {
        var entities = await _repository.GetPendingJobRequestsAsync();
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        foreach (var dto in dtos)
        {
            var statusHistory = await _repository.GetStatusHistoryAsync(dto.Id, "JOB_REQUEST");
            var currentStatus = statusHistory.FirstOrDefault()?.ToStatus;
            dto.CurrentStatus = currentStatus?.Name ?? "Unknown";
            if (currentStatus != null)
            {
                dto.Status = _mapper.Map<StatusDto>(currentStatus);
            }
        }

        return dtos;
    }

    public async Task<List<JobRequestListDto>> GetJobRequestsByStatusAsync(string statusCode)
    {
        var entities = await _repository.GetJobRequestsByStatusAsync(statusCode);
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        foreach (var dto in dtos)
        {
            var statusHistory = await _repository.GetStatusHistoryAsync(dto.Id, "JOB_REQUEST");
            var currentStatus = statusHistory.FirstOrDefault()?.ToStatus;
            dto.CurrentStatus = currentStatus?.Name ?? "Unknown";
            if (currentStatus != null)
            {
                dto.Status = _mapper.Map<StatusDto>(currentStatus);
            }
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
        
        // Set current status
        var currentStatus = statusHistory.FirstOrDefault()?.ToStatus;
        dto.CurrentStatus = currentStatus?.Name ?? "Unknown";
        if (currentStatus != null)
        {
            dto.Status = _mapper.Map<StatusDto>(currentStatus);
        }

        // Lấy JD Link
        dto.JdFileUrl = await _repository.GetJdFileUrlAsync(id);

        return dto;
    }

    public async Task<bool> ForwardToDirectorAsync(int id, string? note, int hrManagerId)
    {
        // 1. Tìm trạng thái IN_REVIEW linh hoạt (Code hoặc ID 3)
        var inReviewStatus = await _repository.GetStatusByCodeAsync("IN_REVIEW", 1);
        int targetStatusId = inReviewStatus?.Id ?? 3;

        // 2. Cập nhật trạng thái
        return await _repository.UpdateStatusAsync(id, targetStatusId, hrManagerId, note);
    }

    public async Task<bool> ReturnToDeptManagerAsync(int id, string? reason, int hrManagerId)
    {
        // 1. Tìm trạng thái RETURNED linh hoạt (Code hoặc ID 21)
        var returnedStatus = await _repository.GetStatusByCodeAsync("RETURNED", 1);
        int targetStatusId = returnedStatus?.Id ?? 21;

        // 2. Cập nhật trạng thái
        var success = await _repository.UpdateStatusAsync(id, targetStatusId, hrManagerId, reason);
        
        if (success)
        {
            // 3. Cập nhật tracking time
            await _repository.UpdateLastReturnedAtAsync(id, DateTime.Now);
        }
        
        return success;
    }
}
