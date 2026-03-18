using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Cvexperience
{
    public int Id { get; set; }

    public int CvprofileId { get; set; }

    public string CompanyName { get; set; } = null!;

    public string JobTitle { get; set; } = null!;

    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public string? Description { get; set; }

    public string? Location { get; set; }

    public virtual Cvprofile Cvprofile { get; set; } = null!;
}
