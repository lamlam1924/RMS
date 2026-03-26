namespace RMS.Dto.Reports;

public class ApplyDailyDto
{
    public string Date { get; set; } = "";
    public int TotalApply { get; set; }
}

public class RecruitmentSummaryDto
{
    public int TotalApply { get; set; }
    public int TotalOffer { get; set; }
    public int TotalRejectOffer { get; set; }
    public int TotalHired { get; set; }
}

public class CreateRecruitmentReportDto
{
    public int JobId { get; set; }
    public int TotalApply { get; set; }
    public int TotalOffer { get; set; }
    public int TotalRejectOffer { get; set; }
    public int TotalHired { get; set; }
    public string? Note { get; set; }
}
