using System;
using Microsoft.AspNetCore.Http;

namespace RMS.Dto.DepartmentManager;

public class CreateJobRequestDto
{
    public int PositionId { get; set; }
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}

public class CreateJobRequestForm : CreateJobRequestDto
{
    public IFormFile? JdFile { get; set; }
}
