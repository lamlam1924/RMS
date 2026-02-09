using AutoMapper;
using RMS.Dto.HR;
using RMS.Dto.Common;
using RMS.Entity;

namespace RMS.Mapping;

public class HRJobRequestsProfile : Profile
{
    public HRJobRequestsProfile()
    {
        CreateMap<JobRequest, JobRequestListDto>()
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Position.Department.Name))
            .ForMember(dest => dest.RequestedByName, opt => opt.MapFrom(src => src.RequestedByNavigation.FullName))
            .ForMember(dest => dest.ExpectedStartDate, opt => opt.MapFrom(src => 
                src.ExpectedStartDate.HasValue 
                    ? src.ExpectedStartDate.Value.ToDateTime(TimeOnly.MinValue) 
                    : (DateTime?)null))
            .ForMember(dest => dest.CurrentStatus, opt => opt.Ignore()) // Set separately
            .ForMember(dest => dest.Status, opt => opt.Ignore()); // Set separately

        CreateMap<JobRequest, JobRequestDetailDto>()
            .IncludeBase<JobRequest, JobRequestListDto>()
            .ForMember(dest => dest.StatusHistory, opt => opt.Ignore()); // Set separately

        CreateMap<StatusHistory, StatusHistoryDto>()
            .ForMember(dest => dest.FromStatus, opt => opt.MapFrom(src => src.FromStatus != null ? src.FromStatus.Name : null))
            .ForMember(dest => dest.ToStatus, opt => opt.MapFrom(src => src.ToStatus.Name))
            .ForMember(dest => dest.ChangedById, opt => opt.MapFrom(src => src.ChangedBy))
            .ForMember(dest => dest.ChangedByName, opt => opt.MapFrom(src => src.ChangedByNavigation.FullName))
            .ForMember(dest => dest.ChangedAt, opt => opt.MapFrom(src => src.ChangedAt ?? DateTime.Now));

        CreateMap<Status, StatusDto>()
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Name));
    }
}
