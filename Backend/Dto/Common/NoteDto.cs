namespace RMS.Dto.Common;

/// <summary>
/// Generic request DTO for actions that carry an optional note/comment.
/// Reused across modules (DeptManager submit, HR forward/return, etc.)
/// </summary>
public class NoteDto
{
    public string? Note { get; set; }
}
