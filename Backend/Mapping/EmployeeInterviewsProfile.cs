using AutoMapper;
using RMS.Dto.Common;
using RMS.Dto.Employee;
using RMS.Entity;

namespace RMS.Mapping;

public class EmployeeInterviewsProfile : AutoMapper.Profile
{
    public EmployeeInterviewsProfile()
    {
        // Interview entity to list DTO (null-safe; không dùng ?. trong MapFrom vì expression tree không hỗ trợ)
        CreateMap<Interview, EmployeeInterviewListDto>()
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status != null ? src.Status.Code : ""))
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => src.Status != null ? src.Status.Name : ""))
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application != null && src.Application.Cvprofile != null ? src.Application.Cvprofile.FullName : ""))
            .ForMember(dest => dest.CandidateEmail, opt => opt.MapFrom(src => src.Application != null && src.Application.Cvprofile != null ? src.Application.Cvprofile.Email : ""))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application != null && src.Application.JobRequest != null && src.Application.JobRequest.Position != null ? src.Application.JobRequest.Position.Title : ""))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Application != null && src.Application.JobRequest != null && src.Application.JobRequest.Position != null && src.Application.JobRequest.Position.Department != null ? src.Application.JobRequest.Position.Department.Name : ""))
            .ForMember(dest => dest.HasMyFeedback, opt => opt.Ignore()) // Set in service
            .ForMember(dest => dest.ParticipantRequestId, opt => opt.Ignore());

        // Interview entity to detail DTO (null-safe)
        CreateMap<Interview, EmployeeInterviewDetailDto>()
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status != null ? src.Status.Code : ""))
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => src.Status != null ? src.Status.Name : ""))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application != null && src.Application.JobRequest != null && src.Application.JobRequest.Position != null ? src.Application.JobRequest.Position.Title : ""))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Application != null && src.Application.JobRequest != null && src.Application.JobRequest.Position != null && src.Application.JobRequest.Position.Department != null ? src.Application.JobRequest.Position.Department.Name : ""))
            .ForMember(dest => dest.Candidate, opt => opt.MapFrom(src => src.Application != null && src.Application.Cvprofile != null ? src.Application.Cvprofile : null))
            // Chỉ hiển thị những người được đề cử/đang chờ hoặc đã xác nhận (bỏ qua những người đã từ chối)
            .ForMember(dest => dest.Participants, opt => opt.MapFrom(src => src.InterviewParticipants.Where(p => !p.DeclinedAt.HasValue)))
            .ForMember(dest => dest.EvaluationCriteria, opt => opt.Ignore()) // Mapped separately in service
            .ForMember(dest => dest.HasMyFeedback, opt => opt.Ignore()); // Set in service

        // Candidate profile mapping
        CreateMap<Cvprofile, CandidateProfileDto>()
            .ForMember(dest => dest.Experiences, opt => opt.MapFrom(src => src.Cvexperiences))
            .ForMember(dest => dest.Educations, opt => opt.MapFrom(src => src.Cveducations))
            .ForMember(dest => dest.Certificates, opt => opt.MapFrom(src => src.Cvcertificates))
            .ForMember(dest => dest.Source, opt => opt.MapFrom(src => src.Source))
            .ForMember(dest => dest.CvFileUrl, opt => opt.MapFrom(src => src.CvFileUrl));

        CreateMap<Cvexperience, ExperienceDto>();
        CreateMap<Cveducation, EducationDto>()
            .ForMember(dest => dest.StartYear, opt => opt.MapFrom(src => src.StartYear))
            .ForMember(dest => dest.EndYear, opt => opt.MapFrom(src => src.EndYear))
            .ForMember(dest => dest.Gpa, opt => opt.MapFrom(src => src.Gpa))
            .ForMember(dest => dest.Location, opt => opt.MapFrom(src => src.Location));

        CreateMap<Cvcertificate, CertificateDto>();

        // Interview participants mapping (using Common DTO)
        CreateMap<InterviewParticipant, InterviewParticipantDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : ""))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User != null ? src.User.Email : null))
            .ForMember(dest => dest.InterviewRole, opt => opt.MapFrom(src => src.InterviewRole != null ? src.InterviewRole.Name : ""))
            .ForMember(dest => dest.HasFeedback, opt => opt.MapFrom(src =>
                src.Interview.InterviewFeedbacks.Any(f => f.InterviewerId == src.UserId)));

        // Evaluation criteria mapping (using Common DTO)
        CreateMap<EvaluationCriterion, EvaluationCriterionDto>()
            .ForMember(dest => dest.CriteriaName, opt => opt.MapFrom(src => src.Name));
    }
}
