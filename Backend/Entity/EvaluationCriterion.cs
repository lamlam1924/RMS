using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class EvaluationCriterion
{
    public int Id { get; set; }

    public int TemplateId { get; set; }

    public string Name { get; set; } = null!;

    public decimal Weight { get; set; }

    public virtual ICollection<InterviewScore> InterviewScores { get; set; } = new List<InterviewScore>();

    public virtual EvaluationTemplate Template { get; set; } = null!;
}
