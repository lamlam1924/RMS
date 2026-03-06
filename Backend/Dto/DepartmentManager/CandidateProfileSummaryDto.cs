namespace RMS.Dto.DepartmentManager;

public class CandidateProfileSummaryDto
{
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public string? Summary { get; set; }
    public int YearsOfExperience { get; set; }
}
