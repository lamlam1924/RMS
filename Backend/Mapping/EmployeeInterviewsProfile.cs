using AutoMapper;
using RMS.Dto.Common;
using RMS.Dto.Employee;
using RMS.Entity;

namespace RMS.Mapping;

public class EmployeeInterviewsProfile : AutoMapper.Profile
{
    public EmployeeInterviewsProfile()
    {
        // Interview entity to list DTO
        CreateMap<Interview, EmployeeInterviewListDto>()
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status.Code))
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => src.Status.Name))
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application.Cvprofile.FullName))
            .ForMember(dest => dest.CandidateEmail, opt => opt.MapFrom(src => src.Application.Cvprofile.Email))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Department.Name))
            .ForMember(dest => dest.HasMyFeedback, opt => opt.Ignore()); // Set in service

        // Interview entity to detail DTO
        CreateMap<Interview, EmployeeInterviewDetailDto>()
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status.Code))
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => src.Status.Name))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Department.Name))
            .ForMember(dest => dest.Candidate, opt => opt.MapFrom(src => src.Application.Cvprofile))
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => src.InterviewParticipants))
            .ForMember(dest => dest.EvaluationCriteria, opt => opt.Ignore()) // Mapped separately in service
            .ForMember(dest => dest.HasMyFeedback, opt => opt.Ignore()); // Set in service

        // Candidate profile mapping
        CreateMap<Cvprofile, CandidateProfileDto>()
            .ForMember(dest => dest.Experiences, opt => opt.MapFrom(src => src.Cvexperiences))
            .ForMember(dest => dest.Educations, opt => opt.MapFrom(src => src.Cveducations));

        CreateMap<Cvexperience, ExperienceDto>();
        CreateMap<Cveducation, EducationDto>();

        // Interview participants mapping (using Common DTO)
        CreateMap<InterviewParticipant, InterviewParticipantDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.InterviewRole, opt => opt.MapFrom(src => src.InterviewRole != null ? src.InterviewRole.Name : "Unknown"))
            .ForMember(dest => dest.HasFeedback, opt => opt.MapFrom(src =>
                src.Interview.InterviewFeedbacks.Any(f => f.InterviewerId == src.UserId)));

        // Evaluation criteria mapping (using Common DTO)
        CreateMap<EvaluationCriterion, EvaluationCriterionDto>()
            .ForMember(dest => dest.CriteriaName, opt => opt.MapFrom(src => src.Name));
    }
}
