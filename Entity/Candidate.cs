using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Candidate
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public string? PasswordHash { get; set; }

    public string? GoogleId { get; set; }

    public string AuthProvider { get; set; } = null!;

    public virtual ICollection<Cvprofile> Cvprofiles { get; set; } = new List<Cvprofile>();
}
