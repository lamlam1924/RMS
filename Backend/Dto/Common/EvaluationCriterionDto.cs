namespace RMS.Dto.Common;

/// <summary>
/// Evaluation criterion DTO - shared across Employee and DepartmentManager modules
/// </summary>
public class EvaluationCriterionDto
{
    public int Id { get; set; }
    public string CriteriaName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Weight { get; set; }
    public int MaxScore { get; set; }
}
