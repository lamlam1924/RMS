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
            .ForMember(dest => dest.IsReadOnlyNominatorAccess, opt => opt.Ignore())
            .ForMember(dest => dest.ParticipantRequestId, opt => opt.Ignore())
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application.Cvprofile.FullName))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status.Code))
            // Chỉ những người được đề cử/đang chờ hoặc đã xác nhận (bỏ qua đã từ chối)
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => src.InterviewParticipants.Where(p => !p.DeclinedAt.HasValue)));

        CreateMap<Interview, DeptManagerInterviewDetailDto>()
            .ForMember(dest => dest.IsReadOnlyNominatorAccess, opt => opt.Ignore())
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application.Cvprofile.FullName))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status.Code))
            // Chỉ hiển thị những người được đề cử/đang chờ hoặc đã xác nhận (bỏ qua đã từ chối)
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => src.InterviewParticipants.Where(p => !p.DeclinedAt.HasValue)))
            .ForMember(dest => dest.CandidateProfile, opt => opt.MapFrom(src => src.Application.Cvprofile))
            .ForMember(dest => dest.EvaluationCriteria, opt => opt.Ignore()) // Mapped separately
            .ForMember(dest => dest.HasMyFeedback, opt => opt.Ignore()) // Set in service
            .ForMember(dest => dest.PreviousRounds, opt => opt.Ignore()); // Populated in service

        CreateMap<InterviewParticipant, InterviewParticipantDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User != null ? src.User.Email : null))
            .ForMember(dest => dest.InterviewRole, opt => opt.MapFrom(src => src.InterviewRole != null ? src.InterviewRole.Name : ""))
            .ForMember(dest => dest.HasFeedback, opt => opt.MapFrom(src => 
                src.Interview.InterviewFeedbacks.Any(f => f.InterviewerId == src.UserId)));

        CreateMap<Cvprofile, CandidateProfileSummaryDto>()
            .ForMember(dest => dest.Experiences, opt => opt.MapFrom(src => src.Cvexperiences))
            .ForMember(dest => dest.Educations, opt => opt.MapFrom(src => src.Cveducations))
            .ForMember(dest => dest.Certificates, opt => opt.MapFrom(src => src.Cvcertificates))
            .ForMember(dest => dest.Source, opt => opt.MapFrom(src => src.Source));

        CreateMap<Cvexperience, CandidateCvExperienceDto>();
        CreateMap<Cveducation, CandidateCvEducationDto>();
        CreateMap<Cvcertificate, CandidateCertificateDto>();

        CreateMap<EvaluationCriterion, EvaluationCriterionDto>()
            .ForMember(dest => dest.CriteriaName, opt => opt.MapFrom(src => src.Name));
    }
}
