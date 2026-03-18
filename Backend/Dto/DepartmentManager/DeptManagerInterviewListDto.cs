using System;
using System.Collections.Generic;
using RMS.Dto.Common;

namespace RMS.Dto.DepartmentManager;

public class DeptManagerInterviewListDto
{
    public int Id { get; set; }
    public int RoundNo { get; set; }
    public required string CandidateName { get; set; }
    public required string PositionTitle { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    public required string StatusCode { get; set; }
    public List<InterviewParticipantDto> Participants { get; set; } = new();
}
