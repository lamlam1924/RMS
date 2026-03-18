using RMS.Dto.Common;
using RMS.Dto.Employee;

namespace RMS.Service;

/// <summary>
/// Service for Employee interview participation
/// </summary>
public interface IEmployeeInterviewsService
{
    /// <summary>
    /// Get all interviews where employee is assigned as participant
    /// </summary>
    Task<List<EmployeeInterviewListDto>> GetMyInterviewsAsync(int userId);

    /// <summary>
    /// Get upcoming interviews (next 7 days) for employee
    /// </summary>
    Task<List<EmployeeInterviewListDto>> GetUpcomingInterviewsAsync(int userId);

    /// <summary>
    /// Get interview detail with candidate info and evaluation criteria
    /// Only if employee is assigned to this interview
    /// </summary>
    Task<EmployeeInterviewDetailDto?> GetInterviewDetailAsync(int interviewId, int userId);

    /// <summary>
    /// Submit interview feedback and scores
    /// </summary>
    Task<ActionResponseDto> SubmitInterviewFeedbackAsync(int interviewId, int userId, SubmitInterviewFeedbackDto dto);
}
