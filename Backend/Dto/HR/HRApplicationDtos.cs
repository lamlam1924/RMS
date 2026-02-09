using RMS.Dto.Common;

namespace RMS.Dto.HR;

public class ApplicationListDto
{
    public int Id { get; set; }
    public string CandidateName { get; set; } = "";
    public string? CandidateEmail { get; set; }
    public string? CandidatePhone { get; set; }
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public int StatusId { get; set; }
    public string CurrentStatus { get; set; } = "";
    public int Priority { get; set; }
    public DateTime AppliedDate { get; set; }
    public int? YearsOfExperience { get; set; }
}

public class ApplicationDetailDto : ApplicationListDto
{
    public string? Phone { get; set; }
    public string? CVFileName { get; set; }
    public string? CVUrl { get; set; }
    public List<StatusHistoryDto> StatusHistory { get; set; } = new();
}

public class UpdateApplicationStatusDto
{
    public int ApplicationId { get; set; }
    public int ToStatusId { get; set; }
    public string? Note { get; set; }
}
