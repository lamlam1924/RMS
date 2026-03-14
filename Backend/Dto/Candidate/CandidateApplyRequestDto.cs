using Microsoft.AspNetCore.Http;

namespace RMS.Dto.Candidate;

public class CandidateApplyRequestDto
{
    public IFormFile? CvFile { get; set; }
}