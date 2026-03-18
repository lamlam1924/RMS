using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class EntityType
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<FileUploaded> FileUploadeds { get; set; } = new List<FileUploaded>();

    public virtual ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();
}
