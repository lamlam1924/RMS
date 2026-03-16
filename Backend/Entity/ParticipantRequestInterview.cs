namespace RMS.Entity;

/// <summary>N–N: một request gắn 1 hoặc nhiều interview (single = 1 dòng, batch = N dòng).</summary>
public partial class ParticipantRequestInterview
{
    public int RequestId { get; set; }
    public int InterviewId { get; set; }

    public virtual ParticipantRequest Request { get; set; } = null!;
    public virtual Interview Interview { get; set; } = null!;
}
