using System;
using Microsoft.AspNetCore.Http;

namespace RMS.Dto.DepartmentManager;

public class UpdateJobRequestDto
{
    public int Quantity { get; set; }
    public int Priority { get; set; }
    public decimal? Budget { get; set; }
    public string? Reason { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}

public class UpdateJobRequestForm : UpdateJobRequestDto
{
    public IFormFile? JdFile { get; set; }
}
