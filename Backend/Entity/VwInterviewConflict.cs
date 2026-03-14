using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class VwInterviewConflict
{
    public int Interview1Id { get; set; }

    public DateTime Interview1Start { get; set; }

    public DateTime Interview1End { get; set; }

    public int Interview2Id { get; set; }

    public DateTime Interview2Start { get; set; }

    public DateTime Interview2End { get; set; }

    public int ConflictingUserId { get; set; }

    public string ConflictingUserName { get; set; } = null!;

    public string ConflictType { get; set; } = null!;

    public string Interview1Candidate { get; set; } = null!;

    public string Interview2Candidate { get; set; } = null!;
}
