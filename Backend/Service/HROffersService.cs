using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Repository;
using RMS.Repository.Interface;
using RMS.Service.Interface;

namespace RMS.Service;

public class HROffersService : IHROffersService
{
    private readonly IHROffersRepository _repository;
    private readonly IAuthRepository _authRepository;
    private readonly IInterviewEmailService _interviewEmailService;

    public HROffersService(
        IHROffersRepository repository,
        IAuthRepository authRepository,
        IInterviewEmailService interviewEmailService)
    {
        _repository = repository;
        _authRepository = authRepository;
        _interviewEmailService = interviewEmailService;
    }

    public async Task<List<OfferListDto>> GetOffersAsync()
    {
        return await _repository.GetOffersAsync();
    }

    public async Task<List<OfferListDto>> GetOffersByStatusAsync(int statusId)
    {
        return await _repository.GetOffersAsync(statusId);
    }

    public async Task<List<OfferListDto>> GetAcceptedForStaffAsync()
    {
        return await _repository.GetAcceptedForStaffAsync();
    }

    public async Task<List<OfferListDto>> GetDeclinedForStaffAsync()
    {
        return await _repository.GetDeclinedForStaffAsync();
    }

    public async Task<List<OfferListDto>> GetAcceptedForManagerAsync()
    {
        return await _repository.GetAcceptedForManagerAsync();
    }

    public async Task<List<OfferListDto>> GetPendingOffersAsync()
    {
        return await _repository.GetPendingOffersAsync();
    }

    public async Task<List<OfferListDto>> GetApprovedOffersAsync()
    {
        return await _repository.GetApprovedOffersAsync();
    }

    public async Task<List<OfferListDto>> GetEditedOffersAsync()
    {
        return await _repository.GetEditedOffersAsync();
    }

    public async Task<List<OfferListDto>> GetPendingHRManagerOffersAsync()
    {
        return await _repository.GetPendingHRManagerOffersAsync();
    }

    public async Task<List<OfferListDto>> GetNegotiatingOffersAsync()
    {
        return await _repository.GetNegotiatingOffersAsync();
    }

    public async Task<ActionResponseDto> SaveOfferInNegotiationAsync(int offerId, UpdateOfferDto dto, int userId)
    {
        var startDateError = ValidateOfferStartDateNotInPast(dto.StartDate);
        if (startDateError != null)
            return startDateError;

        var success = await _repository.SaveOfferEditHistoryAsync(offerId, dto.Salary, dto.Benefits, dto.StartDate, userId);
        return ResponseHelper.CreateActionResponse(
            success,
            "Đã lưu thay đổi và lịch sử chỉnh sửa",
            "Không thể lưu. Chỉ offer đang thương lượng mới được chỉnh sửa.");
    }

    public async Task<ActionResponseDto> SubmitNegotiationToManagerAsync(int offerId, int userId)
    {
        var success = await _repository.SubmitNegotiationToManagerAsync(offerId, userId);
        return ResponseHelper.CreateActionResponse(
            success,
            "Đã gửi cho HR Manager.",
            "Không thể gửi. Chỉ offer đang thương lượng mới được gửi.");
    }

    public async Task<ActionResponseDto> ForwardToDirectorAsync(int offerId, int userId)
    {
        var success = await _repository.ForwardToDirectorAsync(offerId, userId);
        return ResponseHelper.CreateActionResponse(
            success,
            "Đã chuyển giám đốc duyệt.",
            "Không thể chuyển. Chỉ offer chờ HR Manager mới được chuyển.");
    }

    public async Task<OfferDetailDto?> GetOfferByIdAsync(int id)
    {
        return await _repository.GetOfferByIdAsync(id);
    }

    public async Task<OfferListDto?> GetOfferByApplicationIdAsync(int applicationId)
    {
        return await _repository.GetOfferByApplicationIdAsync(applicationId);
    }

    public async Task<ActionResponseDto> CreateOfferAsync(CreateOfferDto dto, int userId)
    {
        var startDateError = ValidateOfferStartDateNotInPast(dto.StartDate);
        if (startDateError != null)
            return startDateError;

        var budget = await _repository.GetJobRequestBudgetAsync(dto.JobRequestId);
        if (budget.HasValue && dto.Salary > budget.Value)
        {
            return ResponseHelper.Error(
                $"Mức lương offer không được vượt quá mức tối đa của phỏng vấn/vị trí ({budget.Value:N0} VNĐ).");
        }

        var offerId = await _repository.CreateOfferAsync(
            dto.CandidateId, dto.JobRequestId, dto.Salary, dto.Benefits, dto.StartDate, userId, dto.ApplicationId);

        return ResponseHelper.CreateActionResponse(offerId, "Offer");
    }

    public async Task<ActionResponseDto> UpdateOfferAsync(int offerId, UpdateOfferDto dto, int userId)
    {
        var startDateError = ValidateOfferStartDateNotInPast(dto.StartDate);
        if (startDateError != null)
            return startDateError;

        var success = await _repository.UpdateOfferAsync(offerId, dto.Salary, dto.Benefits, dto.StartDate, userId);
        return ResponseHelper.CreateActionResponse(
            success,
            "Đã cập nhật thư mời thành công",
            "Không thể chỉnh sửa. Chỉ offer ở trạng thái Nháp hoặc Đang duyệt mới được sửa.");
    }

    public async Task<ActionResponseDto> UpdateOfferStatusAsync(UpdateOfferStatusDto dto, int userId)
    {
        var success = await _repository.UpdateOfferStatusAsync(dto.OfferId, dto.ToStatusId, userId, dto.Note);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Offer submitted for Director review successfully", 
            "Invalid status transition. HR can only submit DRAFT offers to IN_REVIEW."
        );
    }

    public async Task<ActionResponseDto> SendOfferAsync(int offerId, int userId)
    {
        var success = await _repository.SendOfferAsync(offerId, userId);

        return ResponseHelper.CreateActionResponse(
            success, 
            "Offer sent successfully", 
            "Failed to send offer. Only DRAFT, IN_REVIEW or APPROVED offers can be sent to candidate."
        );
    }

    public async Task<ActionResponseDto> UpdateOfferAfterNegotiationAsync(int offerId, UpdateOfferAfterNegotiationDto dto, int userId)
    {
        var startDateError = ValidateOfferStartDateNotInPast(dto.StartDate);
        if (startDateError != null)
            return startDateError;

        var success = await _repository.UpdateOfferAfterNegotiationAsync(
            offerId, dto.ProposedSalary, dto.Benefits, dto.StartDate, userId);

        return ResponseHelper.CreateActionResponse(
            success,
            "Offer updated and resent successfully",
            "Failed to update offer (offer must be in NEGOTIATING status)");
    }

    public async Task<ActionResponseDto> SendAcceptedOffersToManagerAsync(List<int> offerIds, int userId)
    {
        if (offerIds == null || !offerIds.Any())
            return ResponseHelper.CreateActionResponse(false, "", "Vui lòng chọn ít nhất một thư mời");

        var offers = await _repository.GetOffersByIdsAsync(offerIds);
        var acceptedOnly = offers.Where(o => o.StatusId == 19).ToList();
        if (!acceptedOnly.Any())
            return ResponseHelper.CreateActionResponse(false, "", "Chỉ có thể gửi các thư mời đã được ứng viên chấp nhận");

        var managerEmails = await _authRepository.GetUserEmailsByRoleAsync("HR_MANAGER");
        if (managerEmails == null || !managerEmails.Any())
            return ResponseHelper.CreateActionResponse(false, "", "Không tìm thấy HR Manager để gửi");

        var sender = await _authRepository.GetUserByIdAsync(userId);
        var senderName = sender?.FullName ?? "HR Staff";

        var items = acceptedOnly.Select(o => new AcceptedOfferItem
        {
            CandidateName = o.CandidateName ?? "",
            PositionTitle = o.PositionTitle ?? "",
            DepartmentName = o.DepartmentName ?? "",
            Salary = o.Salary
        }).ToList();

        // Đánh dấu đã gửi → chuyển khỏi danh sách HR Staff, hiện ở HR Manager
        var offerIdsToMark = acceptedOnly.Select(o => o.Id).ToList();
        await _repository.MarkAcceptedOffersSentToManagerAsync(offerIdsToMark, userId);

        try
        {
            await _interviewEmailService.SendAcceptedOffersToManagerAsync(new AcceptedOffersToManagerData
            {
                ManagerEmails = managerEmails,
                Items = items,
                SenderName = senderName
            });
            return ResponseHelper.CreateActionResponse(true, $"Đã gửi danh sách {items.Count} ứng viên đến HR Manager", "");
        }
        catch (Exception)
        {
            // Email thất bại (timeout, SMTP lỗi...) - vẫn trả success vì HR Manager có thể xem danh sách tại trang Offer
            return ResponseHelper.CreateActionResponse(true,
                $"Đã gửi danh sách {items.Count} ứng viên. Lưu ý: Không thể gửi email thông báo cho HR Manager (có thể do cấu hình SMTP). HR Manager vẫn có thể xem danh sách tại trang Offer.",
                "");
        }
    }

    public async Task<ActionResponseDto> SendOffersToManagerAsync(List<int> offerIds, string type, int userId)
    {
        if (offerIds == null || !offerIds.Any())
            return ResponseHelper.CreateActionResponse(false, "", "Vui lòng chọn ít nhất một thư mời");

        if (type != "accepted" && type != "declined")
            return ResponseHelper.CreateActionResponse(false, "", "Loại offer không hợp lệ");

        var offers = await _repository.GetOffersByIdsAsync(offerIds);
        
        // Filter by type
        var targetStatusId = type == "accepted" ? 19 : 20;
        var filteredOffers = offers.Where(o => o.StatusId == targetStatusId).ToList();
        
        if (!filteredOffers.Any())
        {
            var message = type == "accepted" 
                ? "Chỉ có thể gửi các thư mời đã được ứng viên chấp nhận" 
                : "Chỉ có thể gửi các thư mời đã bị ứng viên từ chối";
            return ResponseHelper.CreateActionResponse(false, "", message);
        }

        var managerEmails = await _authRepository.GetUserEmailsByRoleAsync("HR_MANAGER");
        if (managerEmails == null || !managerEmails.Any())
            return ResponseHelper.CreateActionResponse(false, "", "Không tìm thấy HR Manager để gửi");

        var sender = await _authRepository.GetUserByIdAsync(userId);
        var senderName = sender?.FullName ?? "HR Staff";

        var items = filteredOffers.Select(o => new AcceptedOfferItem
        {
            CandidateName = o.CandidateName ?? "",
            PositionTitle = o.PositionTitle ?? "",
            DepartmentName = o.DepartmentName ?? "",
            Salary = o.Salary
        }).ToList();

        // Mark as sent to manager FIRST (before email)
        var offerIdsToMark = filteredOffers.Select(o => o.Id).ToList();
        await _repository.MarkAcceptedOffersSentToManagerAsync(offerIdsToMark, userId);

        // Send email asynchronously (fire-and-forget) - don't wait for it
        _ = Task.Run(async () =>
        {
            try
            {
                await _interviewEmailService.SendAcceptedOffersToManagerAsync(new AcceptedOffersToManagerData
                {
                    ManagerEmails = managerEmails,
                    Items = items,
                    SenderName = senderName
                });
            }
            catch (Exception ex)
            {
                // Log error but don't throw - email is optional
                Console.WriteLine($"Email send failed: {ex.Message}");
            }
        });

        // Return immediately without waiting for email
        var successMessage = type == "accepted"
            ? $"Đã gửi danh sách {items.Count} ứng viên đã chấp nhận đến HR Manager"
            : $"Đã gửi danh sách {items.Count} ứng viên đã từ chối đến HR Manager";
            
        return ResponseHelper.CreateActionResponse(true, successMessage, "");
    }

    private static ActionResponseDto? ValidateOfferStartDateNotInPast(DateOnly? startDate)
    {
        if (!startDate.HasValue)
            return null;

        var today = DateOnly.FromDateTime(DateTimeHelper.Now.Date);
        if (startDate.Value < today)
            return ResponseHelper.Error("Ngày bắt đầu không được là ngày trong quá khứ.");

        return null;
    }
}
