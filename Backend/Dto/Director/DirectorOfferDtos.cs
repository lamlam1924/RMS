namespace RMS.Dto.Director;

public class OfferListDto
{
    public int Id { get; set; }
    public required string CandidateName { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public decimal ProposedSalary { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OfferDetailDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public required string CandidateName { get; set; }
    public required string CandidateEmail { get; set; }
    public required string CandidatePhone { get; set; }
    public required string PositionTitle { get; set; }
    public required string DepartmentName { get; set; }
    public decimal ProposedSalary { get; set; }
    public DateTime? StartDate { get; set; }
    public string? Benefits { get; set; }
    public required string CurrentStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OfferApprovalHistoryDto> ApprovalHistory { get; set; } = new();
}

public class OfferApprovalActionDto
{
    public int OfferId { get; set; }
    public required string Action { get; set; }
    public string? Comment { get; set; }
}
