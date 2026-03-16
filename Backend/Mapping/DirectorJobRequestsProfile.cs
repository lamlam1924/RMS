using AutoMapper;
using RMS.Common;
using RMS.Dto.Director;
using RMS.Entity;

namespace RMS.Mapping;

public class DirectorJobRequestsProfile : Profile
{
    public DirectorJobRequestsProfile()
    {
        // JobRequest Entity -> JobRequestListDto
        CreateMap<JobRequest, JobRequestListDto>()
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Position.Department.Name))
            .ForMember(dest => dest.RequestedByName, opt => opt.MapFrom(src => src.RequestedByNavigation.FullName))
            .ForMember(dest => dest.ExpectedStartDate, opt => opt.MapFrom(src =>
                src.ExpectedStartDate.HasValue
                    ? src.ExpectedStartDate.Value.ToDateTime(TimeOnly.MinValue)
                    : (DateTime?)null))
            .ForMember(dest => dest.CurrentStatus, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt ?? DateTimeHelper.Now));

        // JobRequest Entity -> JobRequestDetailDto
        CreateMap<JobRequest, JobRequestDetailDto>()
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Position.Department.Name))
            .ForMember(dest => dest.RequestedByName, opt => opt.MapFrom(src => src.RequestedByNavigation.FullName))
            .ForMember(dest => dest.RequestedByEmail, opt => opt.MapFrom(src => src.RequestedByNavigation.Email))
            .ForMember(dest => dest.ExpectedStartDate, opt => opt.MapFrom(src =>
                src.ExpectedStartDate.HasValue
                    ? src.ExpectedStartDate.Value.ToDateTime(TimeOnly.MinValue)
                    : (DateTime?)null))
            .ForMember(dest => dest.CurrentStatus, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt ?? DateTimeHelper.Now))
            .ForMember(dest => dest.ApprovalHistory, opt => opt.Ignore()); // Set separately from StatusHistory

        // StatusHistory Entity -> ApprovalHistoryDto
        CreateMap<StatusHistory, ApprovalHistoryDto>()
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => src.ToStatus.Name))
            .ForMember(dest => dest.ChangedByName, opt => opt.MapFrom(src => src.ChangedByNavigation.FullName))
            .ForMember(dest => dest.ChangedByRole, opt => opt.MapFrom(src => src.ChangedByNavigation.Roles.FirstOrDefault() != null ? src.ChangedByNavigation.Roles.FirstOrDefault()!.Name : ""))
            .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Note ?? ""))
            .ForMember(dest => dest.ChangedAt, opt => opt.MapFrom(src => src.ChangedAt ?? DateTimeHelper.Now));
    }
}
