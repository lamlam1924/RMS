using System.Globalization;
using RMS.Service.Interface;

namespace RMS.Service;

/// <summary>
/// Service chuyên xử lý email liên quan đến interview workflow
/// </summary>
public class InterviewEmailService : IInterviewEmailService
{
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<InterviewEmailService> _logger;

    public InterviewEmailService(
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<InterviewEmailService> logger)
    {
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendInterviewInvitationAsync(InterviewInvitationEmailData data)
    {
        try
        {
            var templateData = new
            {
                CandidateName = data.CandidateName,
                PositionTitle = data.PositionTitle,
                RoundName = string.IsNullOrEmpty(data.RoundName) || data.RoundName == $"Vòng {data.RoundNo}"
                ? $"Vòng {data.RoundNo}"
                : $"Vòng {data.RoundNo} - {data.RoundName}",
                InterviewDateTime = data.InterviewDateTime.ToString("dddd, dd/MM/yyyy 'lúc' HH:mm", new CultureInfo("vi-VN")),
                Duration = $"{data.DurationMinutes} phút",
                InterviewType = data.InterviewType == "Online" ? "🖥️ Phỏng vấn trực tuyến" : "🏢 Phỏng vấn trực tiếp",
                LocationLabel = data.InterviewType == "Online" ? "Link Meeting" : "Địa điểm",
                LocationOrLink = data.InterviewType == "Online" ? data.MeetingLink : data.Location,
                PreparationNotes = data.PreparationNotes ?? "Vui lòng chuẩn bị giới thiệu bản thân và kinh nghiệm làm việc.",
                ConfirmDeadline = data.ConfirmDeadline.ToString("dd/MM/yyyy HH:mm", new CultureInfo("vi-VN")),
                ConfirmLink = data.ConfirmLink,
                DeclineLink = data.DeclineLink,
                HREmail = data.HREmail,
                HRPhone = data.HRPhone
            };

            await _emailService.SendTemplatedEmailAsync(
                data.CandidateEmail,
                $"Lời mời phỏng vấn - {data.PositionTitle}",
                "InterviewInvitation",
                templateData
            );

            _logger.LogInformation("Interview invitation sent to {Email} for position {Position}", 
                data.CandidateEmail, data.PositionTitle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send interview invitation to {Email}", data.CandidateEmail);
            throw;
        }
    }

    public async Task SendInterviewReminderAsync(InterviewReminderEmailData data)
    {
        try
        {
            var timeUntil = data.HoursUntilInterview < 24 
                ? $"Còn {data.HoursUntilInterview} giờ nữa" 
                : $"Còn {data.HoursUntilInterview / 24} ngày nữa";

            var subject = data.HoursUntilInterview <= 2
                ? $"⏰ Nhắc nhở: Phỏng vấn sắp diễn ra trong {data.HoursUntilInterview} giờ"
                : $"📅 Nhắc nhở: Phỏng vấn vào {data.InterviewDateTime:dd/MM/yyyy}";

            var templateData = new
            {
                CandidateName = data.CandidateName,
                TimeUntil = timeUntil,
                InterviewDateTime = data.InterviewDateTime.ToString("dddd, dd/MM/yyyy 'lúc' HH:mm", new CultureInfo("vi-VN")),
                PositionTitle = data.PositionTitle,
                LocationLabel = data.InterviewType == "Online" ? "Link Meeting" : "Địa điểm",
                LocationOrLink = data.InterviewType == "Online" ? data.MeetingLink : data.Location,
                InterviewDetailLink = data.InterviewDetailLink ?? "#"
            };

            await _emailService.SendTemplatedEmailAsync(
                data.CandidateEmail,
                subject,
                "InterviewReminder",
                templateData
            );

            _logger.LogInformation("Interview reminder sent to {Email}", data.CandidateEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send interview reminder to {Email}", data.CandidateEmail);
            throw;
        }
    }

    public async Task SendInterviewPassedAsync(InterviewResultEmailData data)
    {
        try
        {
            var htmlBody = $@"
                <p>Chào <strong>{data.CandidateName}</strong>,</p>
                <p>🎉 Chúc mừng! Bạn đã vượt qua vòng {data.RoundNo} phỏng vấn cho vị trí <strong>{data.PositionTitle}</strong>.</p>
                {(!string.IsNullOrEmpty(data.NextSteps) ? $"<div style='background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0;'><p><strong>Bước tiếp theo:</strong></p><p>{data.NextSteps}</p></div>" : "")}
                <p>Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.</p>
                <p>Trân trọng,<br>Đội ngũ tuyển dụng</p>
            ";

            await _emailService.SendEmailAsync(
                data.CandidateEmail,
                $"✅ Kết quả phỏng vấn vòng {data.RoundNo} - {data.PositionTitle}",
                htmlBody
            );

            _logger.LogInformation("Interview passed notification sent to {Email}", data.CandidateEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send interview passed email to {Email}", data.CandidateEmail);
            throw;
        }
    }

    public async Task SendInterviewFailedAsync(InterviewResultEmailData data)
    {
        try
        {
            var htmlBody = $@"
                <p>Chào <strong>{data.CandidateName}</strong>,</p>
                <p>Cảm ơn bạn đã dành thời gian tham gia phỏng vấn cho vị trí <strong>{data.PositionTitle}</strong>.</p>
                <p>Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng lần này bạn chưa phù hợp với vị trí này.</p>
                {(!string.IsNullOrEmpty(data.Feedback) ? $"<div style='background-color: #fffaf0; padding: 20px; border-radius: 8px; margin: 20px 0;'><p><strong>Nhận xét:</strong></p><p>{data.Feedback}</p></div>" : "")}
                <p>Chúng tôi rất trân trọng sự quan tâm của bạn và hy vọng sẽ có cơ hội hợp tác trong tương lai.</p>
                <p>Chúc bạn thành công trong sự nghiệp!</p>
                <p>Trân trọng,<br>Đội ngũ tuyển dụng</p>
            ";

            await _emailService.SendEmailAsync(
                data.CandidateEmail,
                $"Kết quả phỏng vấn - {data.PositionTitle}",
                htmlBody
            );

            _logger.LogInformation("Interview failed notification sent to {Email}", data.CandidateEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send interview failed email to {Email}", data.CandidateEmail);
            throw;
        }
    }

    public async Task SendInterviewerAssignmentAsync(InterviewerAssignmentEmailData data)
    {
        try
        {
            var templateData = new
            {
                InterviewerName = data.InterviewerName,
                CandidateName = data.CandidateName,
                PositionTitle = data.PositionTitle,
                RoundNo = data.RoundNo,
                InterviewDateTime = data.InterviewDateTime.ToString("dddd, dd/MM/yyyy 'lúc' HH:mm", new CultureInfo("vi-VN")),
                LocationLabel = data.InterviewType == "Online" ? "Link Meeting" : "Địa điểm",
                LocationOrLink = data.InterviewType == "Online" ? data.MeetingLink : data.Location,
                CandidateCVLink = data.CandidateCVLink,
                EvaluationCriteriaLink = data.EvaluationCriteriaLink,
                InterviewDetailLink = data.InterviewDetailLink ?? "#",
                ConfirmLink = data.ConfirmLink,
                DeclineLink = data.DeclineLink,
                ConfirmDeadline = data.ConfirmDeadline.ToString("dd/MM/yyyy HH:mm", new CultureInfo("vi-VN"))
            };

            await _emailService.SendTemplatedEmailAsync(
                data.InterviewerEmail,
                $"Phân công phỏng vấn - {data.CandidateName}",
                "InterviewerAssignment",
                templateData
            );

            _logger.LogInformation("Interviewer assignment sent to {Email}", data.InterviewerEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send interviewer assignment to {Email}", data.InterviewerEmail);
            throw;
        }
    }

    public async Task SendInterviewerAssignmentBulkAsync(InterviewerAssignmentBulkEmailData data)
    {
        try
        {
            var templateData = new
            {
                InterviewerName = data.InterviewerName,
                AssignmentsTableHtml = data.AssignmentsTableHtml,
                ConfirmDeadline = data.ConfirmDeadline.ToString("dd/MM/yyyy HH:mm", new CultureInfo("vi-VN")),
                MyInterviewsLink = data.MyInterviewsLink
            };
            await _emailService.SendTemplatedEmailAsync(
                data.InterviewerEmail,
                "Nhắc nhở: Phân công phỏng vấn",
                "InterviewerAssignmentBulk",
                templateData
            );
            _logger.LogInformation("Interviewer assignment bulk sent to {Email}", data.InterviewerEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send interviewer assignment bulk to {Email}", data.InterviewerEmail);
            throw;
        }
    }

    public async Task SendFeedbackReminderAsync(FeedbackReminderEmailData data)
    {
        try
        {
            var urgency = data.IsOverdue ? "⚠️ QUÁ HẠN" : "⏰ Nhắc nhở";
            var subject = $"{urgency}: Nộp feedback phỏng vấn - {data.CandidateName}";

            var templateData = new
            {
                InterviewerName = data.InterviewerName,
                ReminderMessage = data.IsOverdue 
                    ? "Bạn chưa nộp feedback cho buổi phỏng vấn đã quá hạn:" 
                    : "Nhắc nhở nộp feedback cho buổi phỏng vấn:",
                CandidateName = data.CandidateName,
                PositionTitle = data.PositionTitle,
                InterviewDate = data.InterviewDate.ToString("dd/MM/yyyy", new CultureInfo("vi-VN")),
                FeedbackDeadline = data.FeedbackDeadline.ToString("dd/MM/yyyy HH:mm", new CultureInfo("vi-VN")),
                SubmitFeedbackLink = data.SubmitFeedbackLink,
                HeaderColor = data.IsOverdue ? "linear-gradient(135deg, #f56565 0%, #c53030 100%)" : "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
                HeaderIcon = data.IsOverdue ? "⚠️" : "⏰",
                HeaderText = data.IsOverdue ? "QUÁ HẠN - Nộp feedback" : "Nhắc nhở nộp feedback",
                BoxColor = data.IsOverdue ? "#fff5f5" : "#edf2f7",
                BorderColor = data.IsOverdue ? "#f56565" : "#ed8936",
                DeadlineColor = data.IsOverdue ? "#c53030" : "#c05621"
            };

            await _emailService.SendTemplatedEmailAsync(
                data.InterviewerEmail,
                subject,
                "FeedbackReminder",
                templateData
            );

            _logger.LogInformation("Feedback reminder sent to {Email}", data.InterviewerEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send feedback reminder to {Email}", data.InterviewerEmail);
            throw;
        }
    }

    public async Task SendFeedbackSubmittedNotificationAsync(FeedbackSubmittedEmailData data)
    {
        try
        {
            var allSubmitted = data.SubmittedFeedbacks >= data.TotalInterviewers;
            var subject = allSubmitted 
                ? $"✅ Đã đủ feedback - {data.CandidateName}" 
                : $"📝 Có feedback mới - {data.CandidateName}";

            var htmlBody = $@"
                <p>Chào HR,</p>
                <p><strong>{data.InterviewerName}</strong> đã nộp feedback cho buổi phỏng vấn:</p>
                <div style='background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                    <p><strong>Ứng viên:</strong> {data.CandidateName}</p>
                    <p><strong>Vị trí:</strong> {data.PositionTitle}</p>
                    <p><strong>Vòng:</strong> Vòng {data.RoundNo}</p>
                    <p><strong>Tiến độ:</strong> {data.SubmittedFeedbacks}/{data.TotalInterviewers} interviewer đã nộp</p>
                </div>
                {(allSubmitted ? "<p style='color: #48bb78; font-weight: bold;'>✅ Đã đủ feedback! Bạn có thể chốt kết quả vòng này.</p>" : "")}
                <p style='text-align: center;'>
                    <a href='{data.InterviewDetailLink}' style='display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                        Xem chi tiết
                    </a>
                </p>
            ";

            await _emailService.SendEmailAsync(data.HREmail, subject, htmlBody);

            _logger.LogInformation("Feedback submitted notification sent to HR {Email}", data.HREmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send feedback notification to HR {Email}", data.HREmail);
            throw;
        }
    }

    public async Task SendOfferAcceptedNotificationToHRAsync(OfferAcceptedNotificationData data)
    {
        try
        {
            var subject = $"✅ Ứng viên chấp nhận thư mời - {data.CandidateName}";
            var htmlBody = $@"
                <p>Chào HR Staff,</p>
                <p><strong>{data.CandidateName}</strong> đã chấp nhận thư mời nhận việc cho vị trí <strong>{data.PositionTitle}</strong>.</p>
                <div style='background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                    <p><strong>Ứng viên:</strong> {data.CandidateName}</p>
                    <p><strong>Vị trí:</strong> {data.PositionTitle}</p>
                </div>
                <p style='text-align: center;'>
                    <a href='{data.OfferDetailLink}' style='display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                        Xem chi tiết thư mời
                    </a>
                </p>
            ";

            await _emailService.SendEmailAsync(data.HREmail, subject, htmlBody);

            _logger.LogInformation("Offer accepted notification sent to HR Staff {Email}", data.HREmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send offer accepted notification to HR {Email}", data.HREmail);
            throw;
        }
    }

    public async Task SendAcceptedOffersToManagerAsync(AcceptedOffersToManagerData data)
    {
        if (data.ManagerEmails == null || !data.ManagerEmails.Any() || data.Items == null || !data.Items.Any())
            return;

        try
        {
            var rows = data.Items.Select((item, i) =>
                $"<tr><td>{i + 1}</td><td>{item.CandidateName}</td><td>{item.PositionTitle}</td><td>{item.DepartmentName}</td><td>{item.Salary:N0} đ</td></tr>").ToList();
            var tableRows = string.Join("", rows);

            var subject = $"📋 Danh sách ứng viên đã chấp nhận thư mời ({data.Items.Count} ứng viên)";
            var htmlBody = $@"
                <p>Chào HR Manager,</p>
                <p><strong>{data.SenderName}</strong> (HR Staff) đã gửi danh sách ứng viên đã chấp nhận thư mời nhận việc:</p>
                <table style='border-collapse: collapse; width: 100%; margin: 20px 0;'>
                    <thead>
                        <tr style='background-color: #f3f4f6;'>
                            <th style='border: 1px solid #d1d5db; padding: 10px; text-align: left;'>#</th>
                            <th style='border: 1px solid #d1d5db; padding: 10px; text-align: left;'>Ứng viên</th>
                            <th style='border: 1px solid #d1d5db; padding: 10px; text-align: left;'>Vị trí</th>
                            <th style='border: 1px solid #d1d5db; padding: 10px; text-align: left;'>Phòng ban</th>
                            <th style='border: 1px solid #d1d5db; padding: 10px; text-align: left;'>Mức lương</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
            ";

            foreach (var email in data.ManagerEmails.Distinct())
            {
                await _emailService.SendEmailAsync(email, subject, htmlBody);
                _logger.LogInformation("Accepted offers list sent to HR Manager {Email}", email);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send accepted offers to HR Managers");
            throw;
        }
    }
}
