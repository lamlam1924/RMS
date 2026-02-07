using AutoMapper;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HRApplicationsService : IHRApplicationsService
{
    private readonly IHRApplicationsRepository _repository;
    private readonly IHRJobRequestsRepository _jobRequestsRepository;
    private readonly IMapper _mapper;

    public HRApplicationsService(IHRApplicationsRepository repository, IHRJobRequestsRepository jobRequestsRepository, IMapper mapper)
    {
        _repository = repository;
        _jobRequestsRepository = jobRequestsRepository;
        _mapper = mapper;
    }

    public async Task<List<ApplicationListDto>> GetApplicationsAsync(int? statusId = null)
    {
        var entities = await _repository.GetApplicationsAsync(statusId);
        var dtos = _mapper.Map<List<ApplicationListDto>>(entities);

        foreach (var dto in dtos)
        {
            dto.CurrentStatus = entities.First(e => e.Id == dto.Id).Status.Name;
        }

        return dtos;
    }

    public async Task<ApplicationDetailDto?> GetApplicationByIdAsync(int id)
    {
        var entity = await _repository.GetApplicationByIdAsync(id);
        if (entity == null) return null;

        var dto = _mapper.Map<ApplicationDetailDto>(entity);
        var statusHistory = await _jobRequestsRepository.GetStatusHistoryAsync(id, "Application");

        dto.CurrentStatus = entity.Status.Name;
        dto.StatusHistory = _mapper.Map<List<RMS.Dto.Common.StatusHistoryDto>>(statusHistory);

        return dto;
    }

    public async Task<ActionResponseDto> UpdateApplicationStatusAsync(UpdateApplicationStatusDto dto, int userId)
    {
        var success = await _repository.UpdateApplicationStatusAsync(
            dto.ApplicationId, dto.ToStatusId, userId, dto.Note);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Application status updated successfully", 
            "Failed to update application status"
        );
    }
}
