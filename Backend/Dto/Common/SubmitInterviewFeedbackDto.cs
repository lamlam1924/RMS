namespace RMS.Dto.Common;

public class SubmitInterviewFeedbackDto
{
    public required string Decision { get; set; } // PASS | REJECT
    public string? Comment { get; set; }
}
