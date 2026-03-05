using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Cveducation
{
    public int Id { get; set; }

    public int CvprofileId { get; set; }

    public string SchoolName { get; set; } = null!;

    public string? Location { get; set; }

    public string? Degree { get; set; }

    public string? Major { get; set; }

    public int? StartYear { get; set; }

    public int? EndYear { get; set; }

    public decimal? Gpa { get; set; }

    public virtual Cvprofile Cvprofile { get; set; } = null!;
}
