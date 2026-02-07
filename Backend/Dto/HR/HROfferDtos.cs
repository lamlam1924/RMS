using RMS.Dto.Common;

namespace RMS.Dto.HR;

public class OfferListDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string CandidateName { get; set; } = "";
    public string PositionTitle { get; set; } = "";
    public string DepartmentName { get; set; } = "";
    public decimal Salary { get; set; }
    public int StatusId { get; set; }
    public string CurrentStatus { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class OfferDetailDto : OfferListDto
{
    public List<StatusHistoryDto> StatusHistory { get; set; } = new();
}

public class CreateOfferDto
{
    public int ApplicationId { get; set; }
    public decimal Salary { get; set; }
}

public class UpdateOfferStatusDto
{
    public int OfferId { get; set; }
    public int ToStatusId { get; set; }
    public string? Note { get; set; }
}
