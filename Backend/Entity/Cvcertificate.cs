using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Cvcertificate
{
    public int Id { get; set; }

    public int CvprofileId { get; set; }

    public string CertificateName { get; set; } = null!;

    public string? Issuer { get; set; }

    public int? IssuedYear { get; set; }

    public virtual Cvprofile Cvprofile { get; set; } = null!;
}
