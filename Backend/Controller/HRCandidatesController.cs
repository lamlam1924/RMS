using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RMS.Data;

namespace RMS.Controller;

[ApiController]
[Route("api/hr/candidates")]
[Authorize(Roles = "HR_MANAGER,HR_STAFF")]
public class HRCandidatesController : ControllerBase
{
    private readonly RecruitmentDbContext _context;

    public HRCandidatesController(RecruitmentDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all candidates (for offer creation - select candidate to send offer)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CandidateItemDto>>> GetCandidates()
    {
        var list = await _context.Candidates
            .Where(c => c.IsDeleted != true)
            .OrderBy(c => c.FullName)
            .Select(c => new CandidateItemDto
            {
                Id = c.Id,
                FullName = c.FullName,
                Email = c.Email,
                Phone = c.Phone ?? ""
            })
            .ToListAsync();
        return Ok(list);
    }
}

public class CandidateItemDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
}
