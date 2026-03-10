using AutoMapper;
using RMS.Dto.HR;
using RMS.Entity;

namespace RMS.Mapping;

public class HRApplicationsProfile : Profile
{
    public HRApplicationsProfile()
    {
        CreateMap<Application, ApplicationListDto>()
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Cvprofile.FullName))
            .ForMember(dest => dest.CandidateEmail, opt => opt.MapFrom(src => src.Cvprofile.Email))
            .ForMember(dest => dest.CandidatePhone, opt => opt.MapFrom(src => src.Cvprofile.Phone))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.JobRequest.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.JobRequest.Position.Department.Name))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.JobRequest.Priority > 0 ? src.JobRequest.Priority : 3))
            .ForMember(dest => dest.CurrentStatus, opt => opt.Ignore())
            .ForMember(dest => dest.AppliedDate, opt => opt.MapFrom(src => src.AppliedAt ?? DateTime.Now))
            .ForMember(dest => dest.YearsOfExperience, opt => opt.MapFrom(src => src.Cvprofile.YearsOfExperience));

        CreateMap<Application, ApplicationDetailDto>()
            .IncludeBase<Application, ApplicationListDto>()
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Cvprofile.Candidate.FullName))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Cvprofile.Phone))
            .ForMember(dest => dest.StatusHistory, opt => opt.Ignore());
    }
}
