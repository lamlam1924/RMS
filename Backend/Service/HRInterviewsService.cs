using System.Globalization;
using System.Text;
using RMS.Common;
using RMS.Dto.Common;
using RMS.Dto.HR;
using RMS.Repository.Interface;
using RMS.Service.Interface;
using Microsoft.Extensions.Configuration;

namespace RMS.Service;

public class HRInterviewsService : IHRInterviewsService
{
    private readonly IHRInterviewsRepository _repository;
    private readonly IInterviewEmailService _emailService;
    private readonly IInterviewFeedbackSubmissionService _feedbackSubmissionService;
    private readonly IParticipantRequestService _requestService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HRInterviewsService> _logger;

    public HRInterviewsService(
        IHRInterviewsRepository repository,
        IInterviewEmailService emailService,
        IInterviewFeedbackSubmissionService feedbackSubmissionService,
        IParticipantRequestService requestService,
        IConfiguration configuration,
        ILogger<HRInterviewsService> logger)
    {
        _repository = repository;
        _emailService = emailService;
        _feedbackSubmissionService = feedbackSubmissionService;
        _requestService = requestService;
        _configuration = configuration;
        _logger = logger;
    }

    public Task<List<InterviewListDto>> GetInterviewsAsync(int? scopeByStaffId = null)
        => _repository.GetInterviewsAsync(scopeByStaffId);

    public Task<List<InterviewListDto>> GetUpcomingInterviewsAsync(int? scopeByStaffId = null)
        => _repository.GetUpcomingInterviewsAsync(scopeByStaffId);

    public Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int? scopeByStaffId = null)
        => _repository.GetInterviewDetailAsync(interviewId, scopeByStaffId);

    public async Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId, int? scopeByStaffId = null)
    {
        if (dto.EndTime <= dto.StartTime)
            return ResponseHelper.CreateActionResponse(false, "", "EndTime phải sau StartTime");

        if (scopeByStaffId.HasValue)
        {
            var assignedId = await _repository.GetApplicationAssignedStaffIdAsync(dto.ApplicationId);
            if (assignedId != scopeByStaffId.Value)
                return ResponseHelper.CreateActionResponse(false, "", "Bạn chỉ được tạo phỏng vấn cho đơn ứng tuyển thuộc job được gán cho bạn.");
        }

        try
        {
            var (interviewId, conflictWarning) = await _repository.CreateInterviewAsync(dto, userId);

            if (interviewId <= 0)
                return ResponseHelper.CreateActionResponse(false, "", "Tạo interview thất bại");

            // Send emails asynchronously (don't wait)
            _ = Task.Run(async () =>
            {
                try
                {
                    await SendInterviewEmailsAsync(interviewId, dto);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send interview emails for interview {InterviewId}", interviewId);
                }
            });

            return new ActionResponseDto
            {
                Success = true,
                Message = conflictWarning != null
                    ? $"Interview đã tạo và email đang được gửi (Cảnh báo: {conflictWarning})"
                    : "Interview đã tạo thành công và email đang được gửi",
                Data = new { Id = interviewId, ConflictWarning = conflictWarning }
            };
        }
        catch (InvalidOperationException ex)
        {
            // Conflict business error (ví dụ: candidate đang có interview chưa kết thúc)
            return ResponseHelper.CreateActionResponse(false, "", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi không xác định khi tạo interview");
            return ResponseHelper.CreateActionResponse(false, "", "Đã xảy ra lỗi hệ thống khi tạo interview");
        }
    }

    private async Task SendInterviewEmailsAsync(int interviewId, CreateInterviewDto dto)
    {
        await SendInterviewerEmailsOnlyAsync(new[] { interviewId });
    }

    /// <summary>Tên vòng hiển thị (VD: email). Không gán cứng theo số vòng — mỗi vị trí có thể khác.</summary>
    private string GetRoundName(int roundNo)
    {
        return $"Vòng {roundNo}";
    }

    /// <summary>Gợi ý chuẩn bị cho ứng viên. Có thể mở rộng theo vị trí/vòng sau.</summary>
    private string GetPreparationNotes(int roundNo)
    {
        return "Vui lòng chuẩn bị kỹ lưỡng cho buổi phỏng vấn.";
    }

    public async Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto, int? scopeByStaffId = null)
    {
        if (scopeByStaffId.HasValue)
        {
            var inScope = await _repository.IsInterviewInStaffScopeAsync(interviewId, scopeByStaffId.Value);
            if (!inScope)
                return ResponseHelper.CreateActionResponse(false, "", "Bạn chỉ được cập nhật phỏng vấn thuộc job được gán cho bạn.");
        }
        var success = await _repository.UpdateInterviewAsync(interviewId, dto);
        return ResponseHelper.CreateActionResponse(success, "Interview đã cập nhật", "Không tìm thấy interview");
    }

    public async Task<ActionResponseDto> FinalizeInterviewAsync(int interviewId, FinalizeInterviewDto dto, int userId)
    {
        var decision = dto.Decision.ToUpper();
        if (decision != "PASS" && decision != "REJECT")
            return ResponseHelper.CreateActionResponse(false, "", "Decision phải là PASS hoặc REJECT");

        var success = await _repository.FinalizeInterviewAsync(interviewId, decision, dto.Note, userId);
        return ResponseHelper.CreateActionResponse(success, "Kết quả đã được chốt", "Không tìm thấy interview");
    }

    public async Task<ActionResponseDto> CancelInterviewAsync(int interviewId, int userId, int? scopeByStaffId = null)
    {
        if (scopeByStaffId.HasValue)
        {
            var inScope = await _repository.IsInterviewInStaffScopeAsync(interviewId, scopeByStaffId.Value);
            if (!inScope)
                return ResponseHelper.CreateActionResponse(false, "", "Bạn chỉ được huỷ phỏng vấn thuộc job được gán cho bạn.");
        }
        var success = await _repository.CancelInterviewAsync(interviewId, userId);
        return ResponseHelper.CreateActionResponse(success, "Interview đã huỷ", "Không tìm thấy interview");
    }

    public async Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, SubmitInterviewFeedbackDto dto, int userId)
    {
        var isParticipant = await _repository.IsInterviewParticipantAsync(interviewId, userId);
        if (!isParticipant)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn không được phân công vào phỏng vấn này");

        if (!await _repository.ParticipantHasConfirmedParticipationAsync(interviewId, userId))
            return ResponseHelper.CreateActionResponse(false, "", "Chỉ có thể nộp đánh giá sau khi xác nhận tham gia buổi phỏng vấn");

        var hasFeedback = await _repository.HasFeedbackAsync(interviewId, userId);
        if (hasFeedback)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn đã gửi đánh giá cho phỏng vấn này rồi");

        await _feedbackSubmissionService.SubmitAsync(interviewId, userId, dto.Decision, dto.Comment);
        return ResponseHelper.CreateActionResponse(true, "Đánh giá đã được ghi nhận", "");
    }

    public async Task<bool> IsApplicationInStaffScopeAsync(int applicationId, int staffId)
    {
        var assignedId = await _repository.GetApplicationAssignedStaffIdAsync(applicationId);
        return assignedId == staffId;
    }

    /// <summary>Sau khi chọn online/offline: HR điền Location hoặc MeetingLink (tùy chọn) rồi gửi thông báo chỉ cho người phỏng vấn (interviewer). Ứng viên chỉ nhận khi HR gửi yêu cầu xác nhận tham gia riêng.</summary>
    public async Task<ActionResponseDto> SendInvitationAsync(int interviewId, SendInvitationDto? dto, int? scopeByStaffId = null)
    {
        if (scopeByStaffId.HasValue)
        {
            var inScope = await _repository.IsInterviewInStaffScopeAsync(interviewId, scopeByStaffId.Value);
            if (!inScope)
                return ResponseHelper.CreateActionResponse(false, "", "Bạn chỉ được gửi thông báo cho phỏng vấn thuộc job được gán cho bạn.");
        }
        if (dto != null && (dto.Location != null || dto.MeetingLink != null))
        {
            var updateDto = new UpdateInterviewDto { Location = dto.Location, MeetingLink = dto.MeetingLink };
            await _repository.UpdateInterviewAsync(interviewId, updateDto);
        }
        await SendInterviewerEmailsOnlyAsync(new[] { interviewId });
        return ResponseHelper.CreateActionResponse(true, "Đã gửi thông báo cho người phỏng vấn", "");
    }

    /// <summary>Gửi thông báo theo block: áp dụng cùng địa điểm/link cho nhiều buổi; chỉ gửi cho người phỏng vấn.</summary>
    public async Task<ActionResponseDto> SendInvitationBatchAsync(SendInvitationBatchDto dto, int? scopeByStaffId = null)
    {
        if (dto.InterviewIds == null || !dto.InterviewIds.Any())
            return ResponseHelper.CreateActionResponse(false, "", "Vui lòng chọn ít nhất một buổi phỏng vấn.");
        var updateDto = new UpdateInterviewDto { Location = dto.Location, MeetingLink = dto.MeetingLink };
        var idsToSend = new List<int>();
        foreach (var id in dto.InterviewIds)
        {
            if (scopeByStaffId.HasValue)
            {
                var inScope = await _repository.IsInterviewInStaffScopeAsync(id, scopeByStaffId.Value);
                if (!inScope) continue;
            }
            await _repository.UpdateInterviewAsync(id, updateDto);
            idsToSend.Add(id);
        }
        if (idsToSend.Count > 0)
            await SendInterviewerEmailsOnlyAsync(idsToSend);
        return ResponseHelper.CreateActionResponse(true, $"Đã gửi thông báo cho người phỏng vấn ({idsToSend.Count} buổi)", "");
    }

    /// <summary>Gửi yêu cầu xác nhận tham gia cho ứng viên (sau khi interviewer đã xác nhận). Ứng viên mới thấy buổi trong "Phỏng vấn của tôi" và nhận email nhắc. Khi gửi lại sau đổi lịch: nếu ứng viên đã từ chối thì chuyển sang RESCHEDULED để ứng viên xác nhận lại.</summary>
    public async Task<ActionResponseDto> SendCandidateConfirmationRequestAsync(int interviewId, int userId, int? scopeByStaffId = null)
    {
        if (scopeByStaffId.HasValue)
        {
            var inScope = await _repository.IsInterviewInStaffScopeAsync(interviewId, scopeByStaffId.Value);
            if (!inScope)
                return ResponseHelper.CreateActionResponse(false, "", "Bạn chỉ được gửi yêu cầu cho phỏng vấn thuộc job được gán cho bạn.");
        }

        // Chỉ cho phép gửi khi TẤT CẢ interviewer đã xác nhận tham gia
        var interview = await _repository.GetInterviewDetailAsync(interviewId, scopeByStaffId);
        if (interview == null)
            return ResponseHelper.CreateActionResponse(false, "", "Không tìm thấy phỏng vấn.");

        if (interview.Participants == null || interview.Participants.Count == 0)
            return ResponseHelper.CreateActionResponse(false, "", "Cần có ít nhất một người phỏng vấn được đề cử trước khi gửi cho ứng viên.");

        var allConfirmed = interview.Participants.All(p => p.ConfirmedAt.HasValue && !p.DeclinedAt.HasValue);
        if (!allConfirmed)
        {
            return ResponseHelper.CreateActionResponse(
                false,
                "",
                "Chỉ được gửi yêu cầu xác nhận cho ứng viên khi tất cả người phỏng vấn đã xác nhận tham gia.");
        }

        var sent = await SendCandidateConfirmationRequestsCoreAsync(new[] { interviewId }, userId);
        return ResponseHelper.CreateActionResponse(
            sent > 0,
            sent > 0 ? "Đã gửi yêu cầu xác nhận tham gia cho ứng viên" : "Không thể gửi yêu cầu cho ứng viên.",
            sent > 0 ? "" : "Không thể gửi yêu cầu cho ứng viên.");
    }

    /// <summary>Gửi hàng loạt yêu cầu xác nhận tham gia cho ứng viên (nhắc nhở; mỗi buổi 1 ứng viên).</summary>
    public async Task<ActionResponseDto> SendCandidateConfirmationRequestBatchAsync(SendInvitationBatchDto dto, int userId, int? scopeByStaffId = null)
    {
        if (dto?.InterviewIds == null || !dto.InterviewIds.Any())
            return ResponseHelper.CreateActionResponse(false, "", "Vui lòng chọn ít nhất một buổi phỏng vấn.");
        var idsToSend = new List<int>();
        foreach (var id in dto.InterviewIds)
        {
            if (scopeByStaffId.HasValue)
            {
                var inScope = await _repository.IsInterviewInStaffScopeAsync(id, scopeByStaffId.Value);
                if (!inScope) continue;
            }

            // Chỉ gửi cho những buổi mà tất cả interviewer đã xác nhận tham gia
            var interview = await _repository.GetInterviewDetailAsync(id, scopeByStaffId);
            if (interview == null || interview.Participants == null || interview.Participants.Count == 0)
                continue;

            var allConfirmed = interview.Participants.All(p => p.ConfirmedAt.HasValue && !p.DeclinedAt.HasValue);
            if (!allConfirmed) continue;

            idsToSend.Add(id);
        }
        if (idsToSend.Count == 0)
            return ResponseHelper.CreateActionResponse(false, "", "Không có buổi nào đủ điều kiện (cần tất cả người phỏng vấn đã xác nhận tham gia).");
        var sent = await SendCandidateConfirmationRequestsCoreAsync(idsToSend, userId);
        return ResponseHelper.CreateActionResponse(true, $"Đã gửi yêu cầu xác nhận tham gia cho {sent} ứng viên", "");
    }

    public Task<List<InterviewNeedingAttentionDto>> GetInterviewsNeedingAttentionAsync(int? scopeByStaffId = null)
        => _repository.GetInterviewsNeedingAttentionAsync(scopeByStaffId);

    public async Task<List<InterviewHistoryItemDto>> GetInterviewHistoryAsync(int interviewId, int? scopeByStaffId = null)
    {
        if (scopeByStaffId.HasValue)
        {
            var inScope = await _repository.IsInterviewInStaffScopeAsync(interviewId, scopeByStaffId.Value);
            if (!inScope) return new List<InterviewHistoryItemDto>();
        }
        return await _repository.GetInterviewHistoryAsync(interviewId);
    }

    public async Task<ActionResponseDto> RequestParticipantsAfterRescheduleAsync(int interviewId, int userId, int? scopeByStaffId = null)
    {
        if (scopeByStaffId.HasValue)
        {
            var inScope = await _repository.IsInterviewInStaffScopeAsync(interviewId, scopeByStaffId.Value);
            if (!inScope)
                return ResponseHelper.CreateActionResponse(false, "", "Bạn chỉ được thao tác với phỏng vấn thuộc job được gán cho bạn.");
        }

        var deptManagerId = await _repository.GetDeptManagerUserIdByInterviewIdAsync(interviewId);
        if (!deptManagerId.HasValue || deptManagerId.Value == 0)
            return ResponseHelper.CreateActionResponse(false, "", "Không tìm thấy trưởng phòng ban cho vị trí tuyển dụng này.");

        await _repository.RemoveAllParticipantsAsync(interviewId);
        await _requestService.CreateRequestAsync(interviewId, new CreateParticipantRequestDto
        {
            AssignedToUserId = deptManagerId.Value,
            RequiredCount = 1,
            Message = "Lịch phỏng vấn đã được dời sang ngày mới. Vui lòng đề cử người phỏng vấn cho buổi này."
        }, userId);

        return ResponseHelper.CreateActionResponse(true, "Đã gửi yêu cầu đề cử người phỏng vấn đến trưởng phòng ban cho ngày mới.", "");
    }

    /// <summary>Gửi email nhắc ứng viên xác nhận tham gia và set CandidateInvitationSentAt (hoặc PrepareResend nếu đã từ chối) để ứng viên thấy trong "Phỏng vấn của tôi".</summary>
    private async Task<int> SendCandidateConfirmationRequestsCoreAsync(IReadOnlyList<int> interviewIds, int userId)
    {
        if (interviewIds.Count == 0) return 0;
        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://rms.com";
        var hrEmail = _configuration["Email:HREmail"] ?? "hr@company.com";
        var hrPhone = _configuration["Email:HRPhone"] ?? "0123456789";
        var now = DateTimeHelper.Now;
        var sent = 0;
        foreach (var interviewId in interviewIds)
        {
            var interview = await _repository.GetInterviewDetailAsync(interviewId, null);
            if (interview == null) { _logger.LogWarning("Interview {Id} not found for candidate invitation", interviewId); continue; }

            // Safety: chỉ gửi nếu tất cả interviewer đã xác nhận tham gia
            var participants = interview.Participants ?? new List<InterviewParticipantItemDto>();
            if (participants.Count == 0 || !participants.All(p => p.ConfirmedAt.HasValue && !p.DeclinedAt.HasValue))
            {
                _logger.LogWarning("Skip candidate invitation for interview {Id} because not all interviewers confirmed.", interviewId);
                continue;
            }
            try
            {
                var invitationData = new InterviewInvitationEmailData
                {
                    CandidateEmail = interview.CandidateEmail ?? "candidate@example.com",
                    CandidateName = interview.CandidateName,
                    PositionTitle = interview.PositionTitle,
                    RoundNo = interview.RoundNo,
                    RoundName = GetRoundName(interview.RoundNo),
                    InterviewDateTime = interview.StartTime,
                    DurationMinutes = (int)(interview.EndTime - interview.StartTime).TotalMinutes,
                    InterviewType = string.IsNullOrEmpty(interview.MeetingLink) ? "Offline" : "Online",
                    MeetingLink = interview.MeetingLink,
                    Location = interview.Location,
                    PreparationNotes = GetPreparationNotes(interview.RoundNo),
                    ConfirmDeadline = now.AddDays(1),
                    ConfirmLink = $"{baseUrl}/app/interviews/{interviewId}/confirm",
                    DeclineLink = $"{baseUrl}/app/interviews/{interviewId}/decline",
                    HREmail = hrEmail,
                    HRPhone = hrPhone
                };
                await _emailService.SendInterviewInvitationAsync(invitationData);
                await _repository.PrepareResendCandidateInvitationAsync(interviewId, now, userId);
                sent++;
                _logger.LogInformation("Candidate confirmation request sent for interview {InterviewId}", interviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send candidate confirmation request for interview {InterviewId}", interviewId);
                throw;
            }
        }
        return sent;
    }

    /// <summary>Gửi email chỉ cho người phỏng vấn (sau khi chọn online/offline). Không gửi cho ứng viên.</summary>
    private async Task SendInterviewerEmailsOnlyAsync(IReadOnlyList<int> interviewIds)
    {
        if (interviewIds.Count == 0) return;
        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://rms.com";
        var confirmDeadline = DateTimeHelper.Now.AddDays(2);
        var culture = new CultureInfo("vi-VN");

        // Gộp theo interviewer
        var byUser = new Dictionary<int, (string Email, string UserName, List<(int InterviewId, InterviewDetailDto Interview)>)>();

        foreach (var interviewId in interviewIds)
        {
            var interview = await _repository.GetInterviewDetailAsync(interviewId, null);
            if (interview == null) continue;
            foreach (var p in interview.Participants)
            {
                if (!byUser.TryGetValue(p.UserId, out var list))
                {
                    list = (p.Email, p.UserName, new List<(int, InterviewDetailDto)>());
                    byUser[p.UserId] = list;
                }
                list.Item3.Add((interviewId, interview));
            }
        }

        foreach (var kv in byUser)
        {
            var (email, userName, assignments) = kv.Value;
            var sb = new StringBuilder();
            sb.Append("<table width=\"100%\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px;\">");
            sb.Append("<thead><tr style=\"background: #f1f5f9;\">");
            sb.Append("<th style=\"text-align: left; border: 1px solid #e2e8f0;\">Ứng viên</th>");
            sb.Append("<th style=\"text-align: left; border: 1px solid #e2e8f0;\">Vị trí</th>");
            sb.Append("<th style=\"text-align: left; border: 1px solid #e2e8f0;\">Vòng</th>");
            sb.Append("<th style=\"text-align: left; border: 1px solid #e2e8f0;\">Thời gian</th>");
            sb.Append("<th style=\"text-align: left; border: 1px solid #e2e8f0;\">Thao tác</th>");
            sb.Append("</tr></thead><tbody>");

            foreach (var (id, inv) in assignments)
            {
                var dateStr = inv.StartTime.ToString("dd/MM/yyyy HH:mm", culture);
                var confirmLink = $"{baseUrl}/staff/employee/interviews/{id}/confirm";
                var declineLink = $"{baseUrl}/staff/employee/interviews/{id}/decline";
                var detailLink = $"{baseUrl}/staff/employee/interviews/{id}";
                sb.Append("<tr>");
                sb.Append($"<td style=\"border: 1px solid #e2e8f0;\">{System.Net.WebUtility.HtmlEncode(inv.CandidateName)}</td>");
                sb.Append($"<td style=\"border: 1px solid #e2e8f0;\">{System.Net.WebUtility.HtmlEncode(inv.PositionTitle)}</td>");
                sb.Append($"<td style=\"border: 1px solid #e2e8f0;\">Vòng {inv.RoundNo}</td>");
                sb.Append($"<td style=\"border: 1px solid #e2e8f0;\">{dateStr}</td>");
                sb.Append("<td style=\"border: 1px solid #e2e8f0;\">");
                sb.Append($"<a href=\"{confirmLink}\" style=\"color: #16a34a; margin-right: 8px;\">Xác nhận</a> ");
                sb.Append($"<a href=\"{declineLink}\" style=\"color: #dc2626; margin-right: 8px;\">Từ chối</a> ");
                sb.Append($"<a href=\"{detailLink}\" style=\"color: #667eea;\">Chi tiết</a>");
                sb.Append("</td></tr>");
            }
            sb.Append("</tbody></table>");

            try
            {
                await _emailService.SendInterviewerAssignmentBulkAsync(new InterviewerAssignmentBulkEmailData
                {
                    InterviewerEmail = email,
                    InterviewerName = userName,
                    AssignmentsTableHtml = sb.ToString(),
                    ConfirmDeadline = confirmDeadline,
                    MyInterviewsLink = $"{baseUrl}/staff/employee/interviews"
                });
                _logger.LogInformation("Interviewer assignment bulk sent to {Email} ({Count} buổi)", email, assignments.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send interviewer bulk to {Email}", email);
                throw;
            }
        }
    }
}
