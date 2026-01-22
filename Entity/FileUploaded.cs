using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class FileUploaded
{
    public int Id { get; set; }

    public int FileTypeId { get; set; }

    public int EntityTypeId { get; set; }

    public int EntityId { get; set; }

    public string? StorageProvider { get; set; }

    public string PublicId { get; set; } = null!;

    public string FileUrl { get; set; } = null!;

    public DateTime? UploadedAt { get; set; }

    public int? UploadedBy { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? DeletedBy { get; set; }

    public virtual EntityType EntityType { get; set; } = null!;

    public virtual FileType FileType { get; set; } = null!;
}
