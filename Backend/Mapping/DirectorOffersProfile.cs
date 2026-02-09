using AutoMapper;
using RMS.Dto.Director;
using RMS.Entity;

namespace RMS.Mapping;

public class DirectorOffersProfile : Profile
{
    public DirectorOffersProfile()
    {
        // Offer Entity -> OfferListDto
        CreateMap<Offer, OfferListDto>()
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application.Cvprofile.Candidate.FullName))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Department.Name))
            .ForMember(dest => dest.ProposedSalary, opt => opt.MapFrom(src => src.ProposedSalary))
            .ForMember(dest => dest.CurrentStatus, opt => opt.MapFrom(src => src.Status.Name)) // Map from Status entity
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt ?? DateTime.Now));

        // Offer Entity -> OfferDetailDto
        CreateMap<Offer, OfferDetailDto>()
            .ForMember(dest => dest.ApplicationId, opt => opt.MapFrom(src => src.ApplicationId))
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => src.Application.Cvprofile.Candidate.FullName))
            .ForMember(dest => dest.CandidateEmail, opt => opt.MapFrom(src => src.Application.Cvprofile.Candidate.Email))
            .ForMember(dest => dest.CandidatePhone, opt => opt.MapFrom(src => src.Application.Cvprofile.Candidate.Phone))
            .ForMember(dest => dest.PositionTitle, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Title))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Application.JobRequest.Position.Department.Name))
            .ForMember(dest => dest.ProposedSalary, opt => opt.MapFrom(src => src.ProposedSalary))
            .ForMember(dest => dest.StartDate, opt => opt.Ignore()) // Not in Offer entity
            .ForMember(dest => dest.Benefits, opt => opt.Ignore()) // Not in Offer entity
            .ForMember(dest => dest.CurrentStatus, opt => opt.MapFrom(src => src.Status.Name)) // Map from Status entity
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt ?? DateTime.Now))
            .ForMember(dest => dest.ApprovalHistory, opt => opt.Ignore()); // Set separately from OfferApproval

        // OfferApproval Entity -> OfferApprovalHistoryDto
        CreateMap<OfferApproval, OfferApprovalHistoryDto>()
            .ForMember(dest => dest.ApproverName, opt => opt.MapFrom(src => src.Approver.FullName))
            .ForMember(dest => dest.ApproverRole, opt => opt.MapFrom(src => src.Approver.Roles.FirstOrDefault() != null ? src.Approver.Roles.FirstOrDefault()!.Name : ""))
            .ForMember(dest => dest.Decision, opt => opt.MapFrom(src => src.Decision))
            .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment ?? ""))
            .ForMember(dest => dest.ApprovedAt, opt => opt.MapFrom(src => src.ApprovedAt ?? DateTime.Now));
    }
}
