using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class InterviewScore
{
    public int FeedbackId { get; set; }

    public int CriteriaId { get; set; }

    public decimal Score { get; set; }

    public virtual EvaluationCriterion Criteria { get; set; } = null!;

    public virtual InterviewFeedback Feedback { get; set; } = null!;
}
