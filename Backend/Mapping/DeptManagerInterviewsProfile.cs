using AutoMapper;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Entity;

namespace RMS.Mapping;

public class DeptManagerInterviewsProfile : AutoMapper.Profile
{
    public DeptManagerInterviewsProfile()
    {
        // Entity to DTO mappings
        CreateMap<Interview, DeptManagerInterviewListDto>()
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application.Cvprofile.FullName))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status.Code))
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => src.InterviewParticipants));

        CreateMap<Interview, DeptManagerInterviewDetailDto>()
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application.Cvprofile.FullName))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status.Code))
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => src.InterviewParticipants))
            .ForMember(dest => dest.CandidateProfile, opt => opt.MapFrom(src => src.Application.Cvprofile))
            .ForMember(dest => dest.EvaluationCriteria, opt => opt.Ignore()) // Mapped separately
            .ForMember(dest => dest.HasMyFeedback, opt => opt.Ignore()) // Set in service
            .ForMember(dest => dest.PreviousRounds, opt => opt.Ignore()); // Populated in service

        CreateMap<InterviewParticipant, InterviewParticipantDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.InterviewRole, opt => opt.MapFrom(src => src.InterviewRole != null ? src.InterviewRole.Name : "Unknown"))
            .ForMember(dest => dest.HasFeedback, opt => opt.MapFrom(src => 
                src.Interview.InterviewFeedbacks.Any(f => f.InterviewerId == src.UserId)));

        CreateMap<Cvprofile, CandidateProfileSummaryDto>()
            .ForMember(dest => dest.Experiences, opt => opt.MapFrom(src => src.Cvexperiences))
            .ForMember(dest => dest.Educations, opt => opt.MapFrom(src => src.Cveducations));

        CreateMap<Cvexperience, CandidateCvExperienceDto>();
        CreateMap<Cveducation, CandidateCvEducationDto>();

        CreateMap<EvaluationCriterion, EvaluationCriterionDto>()
            .ForMember(dest => dest.CriteriaName, opt => opt.MapFrom(src => src.Name));
    }
}
