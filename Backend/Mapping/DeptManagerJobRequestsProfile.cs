using AutoMapper;
using RMS.Dto.Common;
using RMS.Dto.DepartmentManager;
using RMS.Entity;

namespace RMS.Mapping;

public class DeptManagerJobRequestsProfile : AutoMapper.Profile
{
    public DeptManagerJobRequestsProfile()
    {
        // Configure DateOnly to DateTime conversion
        CreateMap<DateOnly?, DateTime?>().ConvertUsing(src => 
            src.HasValue ? src.Value.ToDateTime(TimeOnly.MinValue) : null);

        // Entity to DTO mappings
        CreateMap<JobRequest, DeptManagerJobRequestListDto>()
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Position.Department.Name))
            .ForMember(dest => dest.ExpectedStartDate, opt => opt.MapFrom(src => src.ExpectedStartDate))
            .ForMember(dest => dest.StatusCode, opt => opt.Ignore()) // Set in service
            .ForMember(dest => dest.CurrentStatus, opt => opt.Ignore()); // Set in service

        CreateMap<JobRequest, DeptManagerJobRequestDetailDto>()
            .ForMember(dest => dest.PositionId, opt => opt.MapFrom(src => src.PositionId))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Position.Department.Name))
            .ForMember(dest => dest.RequestedByName, opt => opt.MapFrom(src => src.RequestedByNavigation.FullName))
            .ForMember(dest => dest.ExpectedStartDate, opt => opt.MapFrom(src => src.ExpectedStartDate))
            .ForMember(dest => dest.StatusCode, opt => opt.Ignore()) // Set in service
            .ForMember(dest => dest.CurrentStatus, opt => opt.Ignore()) // Set in service
            .ForMember(dest => dest.StatusHistory, opt => opt.Ignore()); // Mapped separately

        // Reuse Common.StatusHistoryDto mapping (mapped in service)

        CreateMap<Application, ApplicationSummaryDto>()
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Cvprofile.FullName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Cvprofile.Email))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Cvprofile.Phone))
            .ForMember(dest => dest.StatusCode, opt => opt.MapFrom(src => src.Status.Code))
            .ForMember(dest => dest.CurrentStatus, opt => opt.MapFrom(src => src.Status.Name))
            .ForMember(dest => dest.AppliedDate, opt => opt.MapFrom(src => src.AppliedAt));

        // DTO to Entity mappings
        CreateMap<CreateJobRequestDto, JobRequest>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.StatusId, opt => opt.Ignore())
            .ForMember(dest => dest.RequestedBy, opt => opt.Ignore())
            .ForMember(dest => dest.ExpectedStartDate, opt => opt.MapFrom(src => 
                src.ExpectedStartDate.HasValue ? DateOnly.FromDateTime(src.ExpectedStartDate.Value) : (DateOnly?)null))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore());

        CreateMap<UpdateJobRequestDto, JobRequest>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PositionId, opt => opt.Ignore())
            .ForMember(dest => dest.StatusId, opt => opt.Ignore())
            .ForMember(dest => dest.RequestedBy, opt => opt.Ignore())
            .ForMember(dest => dest.ExpectedStartDate, opt => opt.MapFrom(src => 
                src.ExpectedStartDate.HasValue ? DateOnly.FromDateTime(src.ExpectedStartDate.Value) : (DateOnly?)null))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

        // Position mapping
        CreateMap<Position, PositionDto>()
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department.Name));
    }
}
