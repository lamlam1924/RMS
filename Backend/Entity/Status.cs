using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Status
{
    public int Id { get; set; }

    public int StatusTypeId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int? OrderNo { get; set; }

    public bool? IsFinal { get; set; }

    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();

    public virtual ICollection<Interview> Interviews { get; set; } = new List<Interview>();

    public virtual ICollection<Offer> Offers { get; set; } = new List<Offer>();

    public virtual ICollection<StatusHistory> StatusHistoryFromStatuses { get; set; } = new List<StatusHistory>();

    public virtual ICollection<StatusHistory> StatusHistoryToStatuses { get; set; } = new List<StatusHistory>();

    public virtual StatusType StatusType { get; set; } = null!;

    public virtual ICollection<WorkflowTransition> WorkflowTransitionFromStatuses { get; set; } = new List<WorkflowTransition>();

    public virtual ICollection<WorkflowTransition> WorkflowTransitionToStatuses { get; set; } = new List<WorkflowTransition>();
}
