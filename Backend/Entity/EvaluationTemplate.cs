using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class EvaluationTemplate
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? PositionId { get; set; }

    public int? RoundNo { get; set; }

    public virtual ICollection<EvaluationCriterion> EvaluationCriteria { get; set; } = new List<EvaluationCriterion>();

    public virtual Position? Position { get; set; }
}
