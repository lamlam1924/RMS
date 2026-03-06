using System.Collections.Generic;

namespace RMS.Dto.DepartmentManager;

public class SubmitInterviewFeedbackDto
{
    public List<InterviewScoreDto> Scores { get; set; } = new();
    public string? Comment { get; set; }
    public required string Decision { get; set; } // PASS or REJECT
}

public class InterviewScoreDto
{
    public int CriterionId { get; set; }
    public int Score { get; set; }
}
