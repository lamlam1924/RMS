using AutoMapper;
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

        foreach (var dto in dtos)
        {
            var statusHistory = await _repository.GetStatusHistoryAsync(dto.Id, "JobRequest");
            dto.CurrentStatus = statusHistory.FirstOrDefault()?.ToStatus?.Name ?? "Unknown";
        }

        return dtos;
    }

    public async Task<List<JobRequestListDto>> GetPendingJobRequestsAsync()
    {
        var entities = await _repository.GetPendingJobRequestsAsync();
        var dtos = _mapper.Map<List<JobRequestListDto>>(entities);

        foreach (var dto in dtos)
        {
            var statusHistory = await _repository.GetStatusHistoryAsync(dto.Id, "JobRequest");
            dto.CurrentStatus = statusHistory.FirstOrDefault()?.ToStatus?.Name ?? "Unknown";
        }

        return dtos;
    }

    public async Task<JobRequestDetailDto?> GetJobRequestByIdAsync(int id)
    {
        var entity = await _repository.GetJobRequestByIdAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<JobRequestDetailDto>(entity);
        var statusHistory = await _repository.GetStatusHistoryAsync(id, "JobRequest");

        dto.CurrentStatus = statusHistory.FirstOrDefault()?.ToStatus?.Name ?? "Unknown";
        dto.StatusHistory = _mapper.Map<List<StatusHistoryDto>>(statusHistory);

        return dto;
    }
}
