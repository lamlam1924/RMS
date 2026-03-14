using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class VwNoShowStatistic
{
    public int ApplicationId { get; set; }

    public int CandidateId { get; set; }

    public string CandidateName { get; set; } = null!;

    public string CandidateEmail { get; set; } = null!;

    public int TotalNoShows { get; set; }

    public DateTime? LastNoShowDate { get; set; }
}
