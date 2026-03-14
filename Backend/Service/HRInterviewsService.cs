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
    private readonly IConfiguration _configuration;
    private readonly ILogger<HRInterviewsService> _logger;

    public HRInterviewsService(
        IHRInterviewsRepository repository,
        IInterviewEmailService emailService,
        IInterviewFeedbackSubmissionService feedbackSubmissionService,
        IConfiguration configuration,
        ILogger<HRInterviewsService> logger)
    {
        _repository = repository;
        _emailService = emailService;
        _feedbackSubmissionService = feedbackSubmissionService;
        _configuration = configuration;
        _logger = logger;
    }

    public Task<List<InterviewListDto>> GetInterviewsAsync()
        => _repository.GetInterviewsAsync();

    public Task<List<InterviewListDto>> GetUpcomingInterviewsAsync()
        => _repository.GetUpcomingInterviewsAsync();

    public Task<InterviewDetailDto?> GetInterviewDetailAsync(int interviewId)
        => _repository.GetInterviewDetailAsync(interviewId);

    public async Task<ActionResponseDto> CreateInterviewAsync(CreateInterviewDto dto, int userId)
    {
        if (dto.EndTime <= dto.StartTime)
            return ResponseHelper.CreateActionResponse(false, "", "EndTime phải sau StartTime");

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

    private async Task SendInterviewEmailsAsync(int interviewId, CreateInterviewDto dto)
    {
        // Get interview details
        var interview = await _repository.GetInterviewDetailAsync(interviewId);
        if (interview == null)
        {
            _logger.LogWarning("Interview {InterviewId} not found for sending emails", interviewId);
            return;
        }

        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://rms.com";
        var hrEmail = _configuration["Email:HREmail"] ?? "hr@company.com";
        var hrPhone = _configuration["Email:HRPhone"] ?? "0123456789";

        // 1. Send invitation to candidate
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
                ConfirmDeadline = DateTime.Now.AddDays(1),
                ConfirmLink = $"{baseUrl}/candidate/interviews/{interviewId}/confirm",
                DeclineLink = $"{baseUrl}/candidate/interviews/{interviewId}/decline",
                HREmail = hrEmail,
                HRPhone = hrPhone
            };

            await _emailService.SendInterviewInvitationAsync(invitationData);
            _logger.LogInformation("Interview invitation sent to candidate for interview {InterviewId}", interviewId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send interview invitation for interview {InterviewId}", interviewId);
        }

        // 2. Send assignment to interviewers
        foreach (var participant in interview.Participants)
        {
            try
            {
                var assignmentData = new InterviewerAssignmentEmailData
                {
                    InterviewerEmail = participant.Email,
                    InterviewerName = participant.UserName,
                    CandidateName = interview.CandidateName,
                    PositionTitle = interview.PositionTitle,
                    RoundNo = interview.RoundNo,
                    InterviewDateTime = interview.StartTime,
                    InterviewType = string.IsNullOrEmpty(interview.MeetingLink) ? "Offline" : "Online",
                    MeetingLink = interview.MeetingLink,
                    Location = interview.Location,
                    CandidateCVLink = $"{baseUrl}/hr/applications/{interview.ApplicationId}",
                    EvaluationCriteriaLink = $"{baseUrl}/hr/criteria/{interview.PositionId}",
                    InterviewDetailLink = $"{baseUrl}/employee/interviews/{interviewId}"
                };

                await _emailService.SendInterviewerAssignmentAsync(assignmentData);
                _logger.LogInformation("Interviewer assignment sent to {Email} for interview {InterviewId}", 
                    participant.Email, interviewId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send interviewer assignment to {Email} for interview {InterviewId}", 
                    participant.Email, interviewId);
            }
        }
    }

    private string GetRoundName(int roundNo)
    {
        return roundNo switch
        {
            1 => "HR Screening",
            2 => "Technical Interview",
            3 => "Manager Interview",
            4 => "Director Interview",
            _ => $"Interview Round {roundNo}"
        };
    }

    private string GetPreparationNotes(int roundNo)
    {
        return roundNo switch
        {
            1 => "Vui lòng chuẩn bị giới thiệu bản thân, kinh nghiệm làm việc và mong muốn về công việc.",
            2 => "Vui lòng chuẩn bị kiến thức chuyên môn, giải thuật và có thể mang theo laptop để làm bài test.",
            3 => "Vui lòng chuẩn bị thảo luận về kinh nghiệm dự án, kỹ năng làm việc nhóm và định hướng phát triển.",
            4 => "Vui lòng chuẩn bị thảo luận về tầm nhìn, mục tiêu nghề nghiệp và mong muốn đóng góp cho công ty.",
            _ => "Vui lòng chuẩn bị kỹ lưỡng cho buổi phỏng vấn."
        };
    }

    public async Task<ActionResponseDto> UpdateInterviewAsync(int interviewId, UpdateInterviewDto dto)
    {
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

    public async Task<ActionResponseDto> CancelInterviewAsync(int interviewId, int userId)
    {
        var success = await _repository.CancelInterviewAsync(interviewId, userId);
        return ResponseHelper.CreateActionResponse(success, "Interview đã huỷ", "Không tìm thấy interview");
    }

    public async Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, SubmitInterviewFeedbackDto dto, int userId)
    {
        var isParticipant = await _repository.IsInterviewParticipantAsync(interviewId, userId);
        if (!isParticipant)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn không được phân công vào phỏng vấn này");

        var hasFeedback = await _repository.HasFeedbackAsync(interviewId, userId);
        if (hasFeedback)
            return ResponseHelper.CreateActionResponse(false, "", "Bạn đã gửi đánh giá cho phỏng vấn này rồi");

        await _feedbackSubmissionService.SubmitAsync(interviewId, userId, dto.Decision, dto.Comment);
        return ResponseHelper.CreateActionResponse(true, "Đánh giá đã được ghi nhận", "");
    }
}
