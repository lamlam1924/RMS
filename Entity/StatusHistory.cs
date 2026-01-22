using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class StatusHistory
{
    public int Id { get; set; }

    public int EntityTypeId { get; set; }

    public int EntityId { get; set; }

    public int? FromStatusId { get; set; }

    public int ToStatusId { get; set; }

    public int ChangedBy { get; set; }

    public DateTime? ChangedAt { get; set; }

    public string? Note { get; set; }

    public virtual User ChangedByNavigation { get; set; } = null!;

    public virtual EntityType EntityType { get; set; } = null!;

    public virtual Status? FromStatus { get; set; }

    public virtual Status ToStatus { get; set; } = null!;
}
