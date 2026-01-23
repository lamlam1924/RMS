using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class FileType
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<FileUploaded> FileUploadeds { get; set; } = new List<FileUploaded>();
}
