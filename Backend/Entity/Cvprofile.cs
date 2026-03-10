using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Cvprofile
{
    public int Id { get; set; }

    public int CandidateId { get; set; }

    public string FullName { get; set; } = null!;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Summary { get; set; }

    public int? YearsOfExperience { get; set; }

    public string? Source { get; set; }

    public string? CvFileUrl { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();

    public virtual Candidate Candidate { get; set; } = null!;

    public virtual ICollection<Cvcertificate> Cvcertificates { get; set; } = new List<Cvcertificate>();

    public virtual ICollection<Cveducation> Cveducations { get; set; } = new List<Cveducation>();

    public virtual ICollection<Cvexperience> Cvexperiences { get; set; } = new List<Cvexperience>();

    public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
}
