namespace RMS.Dto.HR;

public class HRDashboardStatsDto
{
    public int PendingJobRequests { get; set; }
    public int TotalApplications { get; set; }
    public int UpcomingInterviews { get; set; }
    public int PendingOffers { get; set; }
    public int ScreeningApplications { get; set; }
    public int InterviewingApplications { get; set; }
    public int ActiveJobPostings { get; set; }
    public int ReturnedJobRequestsCount { get; set; }
}


public class RecruitmentFunnelDto
{
    public string Stage { get; set; } = "";
    public int Count { get; set; }
}

public class HRStaffTaskSummaryDto
{
    public int StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public string StaffEmail { get; set; } = string.Empty;

    // Done metrics
    public int JobPostingsCreated { get; set; }
    public int OffersCreated { get; set; }
    public int OffersSentToCandidate { get; set; }
    public int OffersSentToManager { get; set; }
    public int NegotiationsHandled { get; set; }

    // Pending metrics
    public int AssignedApprovedRequestsWithoutPosting { get; set; }
    public int AcceptedDeclinedOffersPendingManager { get; set; }
    public int NegotiatingOffersPendingAction { get; set; }

    public int TotalDone =>
        JobPostingsCreated + OffersCreated + OffersSentToCandidate + OffersSentToManager + NegotiationsHandled;

    public int TotalPending =>
        AssignedApprovedRequestsWithoutPosting + AcceptedDeclinedOffersPendingManager + NegotiatingOffersPendingAction;
}

public class HRStaffTaskDetailDto
{
    public int StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public string StaffEmail { get; set; } = string.Empty;
    public HRStaffTaskSummaryDto Summary { get; set; } = new();
    public List<HRPendingJobRequestItemDto> PendingJobRequests { get; set; } = new();
    public List<HRPendingOfferItemDto> PendingOffers { get; set; } = new();
    public List<HRStaffRecentActivityDto> RecentActivities { get; set; } = new();
}

public class HRPendingJobRequestItemDto
{
    public int JobRequestId { get; set; }
    public string PositionTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime? AssignedAt { get; set; }
    public string CurrentStatus { get; set; } = string.Empty;
}

public class HRPendingOfferItemDto
{
    public int OfferId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string PositionTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string PendingReason { get; set; } = string.Empty;
}

public class HRStaffRecentActivityDto
{
    public DateTime ChangedAt { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Note { get; set; }
}
