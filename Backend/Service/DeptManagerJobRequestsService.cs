using AutoMapper;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Entity;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class DeptManagerJobRequestsService : IDeptManagerJobRequestsService
{
    private readonly IDeptManagerJobRequestsRepository _repository;
    private readonly IMapper _mapper;

    public DeptManagerJobRequestsService(
        IDeptManagerJobRequestsRepository repository,
        IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<List<DeptManagerJobRequestListDto>> GetJobRequestsAsync(int managerId)
    {
        var entities = await _repository.GetJobRequestsByManagerIdAsync(managerId);
        var dtos = _mapper.Map<List<DeptManagerJobRequestListDto>>(entities);
        
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            var status = await _repository.GetStatusByIdAsync(entity.StatusId);
            dto.StatusCode = status?.Code ?? "";
            dto.CurrentStatus = status?.Name ?? "";
            dto.JdFileUrl = await _repository.GetJdFileUrlAsync(entity.Id);
        }
        
        return dtos;
    }

    public async Task<DeptManagerJobRequestDetailDto?> GetJobRequestDetailAsync(int id, int managerId)
    {
        var entity = await _repository.GetJobRequestByIdAsync(id, managerId);
        if (entity == null) return null;

        var dto = _mapper.Map<DeptManagerJobRequestDetailDto>(entity);
        var status = await _repository.GetStatusByIdAsync(entity.StatusId);
        dto.StatusCode = status?.Code ?? "";
        dto.CurrentStatus = status?.Name ?? "";
        dto.JdFileUrl = await _repository.GetJdFileUrlAsync(id);

        // Get status history for the history list ONLY
        var history = await _repository.GetJobRequestStatusHistoryAsync(id);
        dto.StatusHistory = _mapper.Map<List<StatusHistoryDto>>(history);

        // Update tracking: Mark as viewed if it was returned
        if (dto.StatusCode == "RETURNED")
        {
            await _repository.UpdateLastViewedAtAsync(id, DateTimeHelper.Now);
        }

        return dto;
    }

    public async Task<ActionResponseDto> ReopenReturnedRequestAsync(int id, int managerId)
    {
        try
        {
            var entity = await _repository.GetJobRequestByIdAsync(id, managerId);
            if (entity == null)
            {
                return ResponseHelper.CreateActionResponse(false, "", "Không tìm thấy yêu cầu tuyển dụng này hoặc bạn không có quyền truy cập.");
            }

            // Fetch current status info for detailed error message
            var currentStatus = await _repository.GetStatusByIdAsync(entity.StatusId);
            
            // Log to debugger/console (simplified for this task)
            string statusInfo = currentStatus != null 
                ? $"{currentStatus.Code} (ID: {entity.StatusId})" 
                : $"Unknown (ID: {entity.StatusId})";

            var success = await _repository.ReopenJobRequestAsync(id, managerId);
            if (success)
            {
                return ResponseHelper.CreateActionResponse(true, "Yêu cầu đã được chuyển về bản nháp để chỉnh sửa", "");
            }
            
            return ResponseHelper.CreateActionResponse(false, "", 
                $"Không thể mở lại yêu cầu (ID: {id}). Trạng thái hiện tại: {statusInfo}. " +
                "Chỉ các yêu cầu ở trạng thái 'Trả về' (RETURNED) mới có thể mở lại.");
        }
        catch (Exception ex)
        {
            return ResponseHelper.CreateActionResponse(false, "", $"Lỗi hệ thống khi mở lại yêu cầu: {ex.Message}");
        }
    }

    public async Task<ActionResponseDto> CreateJobRequestAsync(
        CreateJobRequestDto request, int managerId)
    {
        try
        {
            // Validate input
            var validation = JobRequestValidationHelper.ValidateCreateJobRequest(request);
            if (!validation.IsValid)
            {
                return ResponseHelper.CreateActionResponse(false, "", validation.ErrorMessage!);
            }

            // Validate position access
            var hasAccess = await _repository.ValidatePositionAccessAsync(request.PositionId, managerId);
            if (!hasAccess)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "You can only create job requests for positions in your department");
            }

            // Get DRAFT status
            var draftStatus = await _repository.GetStatusByCodeAsync("DRAFT", 1);
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
            // Validate input
            var validation = JobRequestValidationHelper.ValidateUpdateJobRequest(request);
            if (!validation.IsValid)
            {
                return ResponseHelper.CreateActionResponse(false, "", validation.ErrorMessage!);
            }

            var entity = await _repository.GetJobRequestByIdAsync(id, managerId);
            if (entity == null)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Job request not found or access denied");
            }

            // Load status directly from DB instead of history
            var currentStatus = await _repository.GetStatusByIdAsync(entity.StatusId);

            if (currentStatus == null || (currentStatus.Code != "DRAFT" && currentStatus.Code != "RETURNED"))
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Only draft or returned job requests can be updated");
            }

            // If it was RETURNED, move it back to DRAFT
            if (currentStatus.Code == "RETURNED")
            {
                var draftStatus = await _repository.GetStatusByCodeAsync("DRAFT", 1);
                if (draftStatus != null)
                {
                    entity.StatusId = draftStatus.Id;
                    // History should be handled in a proper repository method if possible
                }
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

            // Load status directly from DB instead of history
            var currentStatus = await _repository.GetStatusByIdAsync(entity.StatusId);
            
            if ((currentStatus == null || currentStatus.Code != "DRAFT") && entity.StatusId != 1)
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", $"Only draft job requests can be submitted. Current status: {currentStatus?.Code ?? "Unknown"} (ID: {entity.StatusId})");
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

            // Load status directly from DB instead of history
            var currentStatus = await _repository.GetStatusByIdAsync(entity.StatusId);

            if (currentStatus == null || (currentStatus.Code != "DRAFT" && currentStatus.Code != "RETURNED"))
            {
                return ResponseHelper.CreateActionResponse(false,
                    "", "Only draft or returned job requests can be deleted");
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
        
        foreach (var dto in dtos)
        {
            var entity = entities.First(e => e.Id == dto.Id);
            // This part is tricky because Application status is not JobRequest status
            // Ideally application status should be included in ApplicationSummaryDto or fetched via repository
        }

        
        return dtos;
    }

    public async Task<List<PositionDto>> GetPositionsAsync(int managerId)
    {
        var positions = await _repository.GetPositionsByManagerIdAsync(managerId);
        return _mapper.Map<List<PositionDto>>(positions);
    }
}
