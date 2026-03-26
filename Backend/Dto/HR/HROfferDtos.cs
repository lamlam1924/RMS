using RMS.Dto.Common;

namespace RMS.Dto.HR;

public class OfferListDto
{
    public int Id { get; set; }
    public int? ApplicationId { get; set; }
    public int JobRequestId { get; set; }
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public decimal Salary { get; set; }
    public string? Benefits { get; set; }
    public DateOnly? StartDate { get; set; }
    public int StatusId { get; set; }
    public string CurrentStatus { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CandidateComment { get; set; }
}

public class OfferDetailDto : OfferListDto
{
    public int? CvprofileId { get; set; }
    public int CandidateId { get; set; }
    public string? CandidateResponse { get; set; }
    public DateTime? CandidateRespondedAt { get; set; }
    public string? CandidateComment { get; set; }
    public DateTime? SentAt { get; set; }
    public List<StatusHistoryDto> StatusHistory { get; set; } = new();
    public List<OfferEditHistoryDto> EditHistory { get; set; } = new();
}

public class OfferEditHistoryDto
{
    public int Id { get; set; }
    public int OfferId { get; set; }
    public int EditedBy { get; set; }
    public string EditedByName { get; set; } = "";
    public DateTime EditedAt { get; set; }
    public decimal? Salary { get; set; }
    public string? Benefits { get; set; }
    public DateOnly? StartDate { get; set; }
}

public class CreateOfferDto
{
    public int CandidateId { get; set; }
    public int JobRequestId { get; set; }
    public int? ApplicationId { get; set; }
    public decimal Salary { get; set; }
    public string? Benefits { get; set; }
    public DateOnly? StartDate { get; set; }
}

public class UpdateOfferStatusDto
{
    public int OfferId { get; set; }
    public int ToStatusId { get; set; }
    public string? Note { get; set; }
}

public class UpdateOfferDto
{
    public decimal Salary { get; set; }
    public string? Benefits { get; set; }
    public DateOnly? StartDate { get; set; }
}

public class CandidateRespondDto
{
    public string Response { get; set; } = ""; // ACCEPT, NEGOTIATE, REJECT
    public string? Comment { get; set; }
}

public class UpdateOfferAfterNegotiationDto
{
    public decimal ProposedSalary { get; set; }
    public string? Benefits { get; set; }
    public DateOnly? StartDate { get; set; }
}

public class SendAcceptedToManagerDto
{
    public List<int> OfferIds { get; set; } = new();
}

public class SendOffersToManagerDto
{
    public List<int> OfferIds { get; set; } = new();
    public string Type { get; set; } = ""; // "accepted" or "declined"
}
