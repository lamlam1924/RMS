using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RMS.Common;
using RMS.Data;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class DeptManagerJobRequestsService : IDeptManagerJobRequestsService
{
    private readonly IDeptManagerJobRequestsRepository _repository;
    private readonly RecruitmentDbContext _context;
    private readonly IMapper _mapper;

    public DeptManagerJobRequestsService(
        IDeptManagerJobRequestsRepository repository,
        RecruitmentDbContext context,
        IMapper mapper)
    {
        _repository = repository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<DeptManagerJobRequestListDto>> GetJobRequestsAsync(int managerId)
    {
        var entities = await _repository.GetJobRequestsByManagerIdAsync(managerId);
        var dtos = _mapper.Map<List<DeptManagerJobRequestListDto>>(entities);
        
        // Load status information for each job request
        var statusIds = entities.Select(e => e.StatusId).Distinct().ToList();
        var statuses = await _context.Statuses
            .Where(s => statusIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id);
            
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            if (statuses.TryGetValue(entity.StatusId, out var status))
            {
                dto.StatusCode = status.Code;
                dto.CurrentStatus = status.Name;
            }
        }
        
        return dtos;
    }

    public async Task<DeptManagerJobRequestDetailDto?> GetJobRequestDetailAsync(int id, int managerId)
    {
        var entity = await _repository.GetJobRequestByIdAsync(id, managerId);
        if (entity == null) return null;

        var dto = _mapper.Map<DeptManagerJobRequestDetailDto>(entity);
        
        // Load status information
        var status = await _context.Statuses.FindAsync(entity.StatusId);
        if (status != null)
        {
            dto.StatusCode = status.Code;
            dto.CurrentStatus = status.Name;
        }

        // Get status history
        var history = await _repository.GetJobRequestStatusHistoryAsync(id);
        dto.StatusHistory = _mapper.Map<List<DeptManagerStatusHistoryDto>>(history);

        return dto;
    }

    public async Task<ActionResponseDto> CreateJobRequestAsync(
        CreateJobRequestDto request, int managerId)
    {
        try
        {
            // Validate position access
            var hasAccess = await _repository.ValidatePositionAccessAsync(request.PositionId, managerId);
            if (!hasAccess)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "You can only create job requests for positions in your department");
            }

            // Get DRAFT status
            var draftStatus = await _context.Statuses
                .FirstOrDefaultAsync(s => s.Code == "DRAFT" && s.StatusTypeId == 1);

            if (draftStatus == null)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "System error: Draft status not found");
            }

            var entity = _mapper.Map<JobRequest>(request);
            entity.RequestedBy = managerId;
            entity.StatusId = draftStatus.Id;
            entity.CreatedAt = DateTimeHelper.Now;
            entity.CreatedBy = managerId;
            entity.IsDeleted = false;

            await _repository.CreateJobRequestAsync(entity);

            var detail = await GetJobRequestDetailAsync(entity.Id, managerId);
            return ResponseHelper.CreateActionResponse(true,
                "Job request created successfully", "", detail);
        }
        catch (Exception ex)
        {
            return ResponseHelper.CreateActionResponse(false,
                "", $"Error creating job request: {ex.Message}");
        }
    }

    public async Task<ActionResponseDto> UpdateJobRequestAsync(
        int id, UpdateJobRequestDto request, int managerId)
    {
        try
        {
            var entity = await _repository.GetJobRequestByIdAsync(id, managerId);
            if (entity == null)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Job request not found or access denied");
            }

            // Load status to check if it's DRAFT
            var status = await _context.Statuses.FindAsync(entity.StatusId);
            if (status == null || status.Code != "DRAFT")
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Only draft job requests can be updated");
            }

            _mapper.Map(request, entity);
            entity.UpdatedAt = DateTimeHelper.Now;
            entity.UpdatedBy = managerId;

            await _repository.UpdateJobRequestAsync(entity);

            var detail = await GetJobRequestDetailAsync(id, managerId);
            return ResponseHelper.CreateActionResponse(true,
                "Job request updated successfully", "", detail);
        }
        catch (Exception ex)
        {
            return ResponseHelper.CreateActionResponse(false,
                "", $"Error updating job request: {ex.Message}");
        }
    }

    public async Task<ActionResponseDto> SubmitJobRequestAsync(int id, int managerId)
    {
        try
        {
            var entity = await _repository.GetJobRequestByIdAsync(id, managerId);
            if (entity == null)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Job request not found or access denied");
            }

            // Load status to check if it's DRAFT
            var status = await _context.Statuses.FindAsync(entity.StatusId);
            if (status == null || status.Code != "DRAFT")
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Only draft job requests can be submitted");
            }

            var success = await _repository.SubmitJobRequestAsync(id, managerId);
            
            return ResponseHelper.CreateActionResponse(success,
                "Job request submitted successfully", "Failed to submit job request");
        }
        catch (Exception ex)
        {
            return ResponseHelper.CreateActionResponse(false,
                "", $"Error submitting job request: {ex.Message}");
        }
    }

    public async Task<ActionResponseDto> DeleteJobRequestAsync(int id, int managerId)
    {
        try
        {
            var entity = await _repository.GetJobRequestByIdAsync(id, managerId);
            if (entity == null)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Job request not found or access denied");
            }

            // Load status to check if it's DRAFT
            var status = await _context.Statuses.FindAsync(entity.StatusId);
            if (status == null || status.Code != "DRAFT")
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Only draft job requests can be deleted");
            }

            var success = await _repository.DeleteJobRequestAsync(id, managerId);
            
            return ResponseHelper.CreateActionResponse(success,
                "Job request deleted successfully", "Failed to delete job request");
        }
        catch (Exception ex)
        {
            return ResponseHelper.CreateActionResponse(false,
                "", $"Error deleting job request: {ex.Message}");
        }
    }

    public async Task<List<ApplicationSummaryDto>> GetApplicationsByJobRequestAsync(
        int jobRequestId, int managerId)
    {
        var entities = await _repository.GetApplicationsByJobRequestIdAsync(jobRequestId, managerId);
        var dtos = _mapper.Map<List<ApplicationSummaryDto>>(entities);
        
        // Load status information
        var statusIds = entities.Select(e => e.StatusId).Distinct().ToList();
        var statuses = await _context.Statuses
            .Where(s => statusIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id);
            
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            if (statuses.TryGetValue(entity.StatusId, out var status))
            {
                dto.StatusCode = status.Code;
                dto.CurrentStatus = status.Name;
            }
        }
        
        return dtos;
    }
}
