using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RMS.Common;
using RMS.Data;
using RMS.Repository;
using RMS.Repository.Interface;
using RMS.Service;
using RMS.Service.Interface;

var builder = WebApplication.CreateBuilder(args);
var env = builder.Environment;
var config = builder.Configuration;

// ======================= DATABASE =======================
builder.Services.AddDbContext<RecruitmentDbContext>(options =>
    options.UseSqlServer(config.GetConnectionString("DefaultConnection"), sqlOpts =>
    {
        sqlOpts.CommandTimeout(60); // Tăng timeout cho truy vấn (mặc định 30s)
    }));

// ======================= CONTROLLERS =======================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// ======================= CORS =======================
// Development: mở hoàn toàn
// Production: đọc từ AllowedOrigins[]
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        if (env.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            var origins = config.GetSection("AllowedOrigins").Get<string[]>() ?? [];
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

// ======================= JWT =======================
var jwtSecret = builder.Configuration["JWT:Secret"]!;
var jwtIssuer = builder.Configuration["JWT:Issuer"]!;
var jwtAudience = builder.Configuration["JWT:Audience"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ======================= SWAGGER =======================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "RMS API", 
        Version = "v1",
        Description = "Recruitment Management System API"
    });
    
    // Fix: Handle duplicate schema names and IFormFile
    c.CustomSchemaIds(type => 
    {
        // Skip IFormFile - Swagger handles it automatically
        if (type == typeof(IFormFile))
            return "File";
        
        // For types with duplicate names, use short namespace + type name
        var fullName = type.FullName ?? type.Name;
        
        // Extract last part of namespace + type name for cleaner schema IDs
        // Example: RMS.Dto.HR.JobRequestDetailDto -> HR_JobRequestDetailDto
        if (fullName.StartsWith("RMS.Dto."))
        {
            var parts = fullName.Split('.');
            if (parts.Length >= 4)
            {
                var namespaceSection = parts[2]; // HR, Director, DepartmentManager, etc.
                var typeName = parts[^1]; // JobRequestDetailDto
                return $"{namespaceSection}_{typeName}".Replace("+", "_").Replace("[", "Of").Replace("]", "");
            }
        }
            
        // Use FullName for other types to avoid conflicts
        return fullName.Replace("+", ".").Replace("[", "Of").Replace("]", "").Replace(".", "_");
    });
    
    // Support file upload in Swagger UI
    c.OperationFilter<SwaggerFileOperationFilter>();
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ======================= UTILITIES =======================
builder.Services.AddAutoMapper(typeof(Program));
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

// ======================= REGISTER SERVICES =======================
//Register Repositories
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAdminUserRepository, AdminUserRepository>();
builder.Services.AddScoped<IAdminRoleRepository, AdminRoleRepository>();
builder.Services.AddScoped<IAdminDepartmentRepository, AdminDepartmentRepository>();
builder.Services.AddScoped<IAdminConfigRepository, AdminConfigRepository>();
builder.Services.AddScoped<IAdminWorkflowRepository, AdminWorkflowRepository>();
builder.Services.AddScoped<IDirectorRepository, DirectorRepository>();
builder.Services.AddScoped<IDeptManagerJobRequestsRepository, DeptManagerJobRequestsRepository>();
builder.Services.AddScoped<IDeptManagerInterviewsRepository, DeptManagerInterviewsRepository>();
builder.Services.AddScoped<IDeptManagerDashboardRepository, DeptManagerDashboardRepository>();
builder.Services.AddScoped<IHRStatisticsRepository, HRStatisticsRepository>();
builder.Services.AddScoped<IHRJobRequestsRepository, HRJobRequestsRepository>();
builder.Services.AddScoped<IHRApplicationsRepository, HRApplicationsRepository>();
builder.Services.AddScoped<IHRInterviewsRepository, HRInterviewsRepository>();
builder.Services.AddScoped<IHROffersRepository, HROffersRepository>();
builder.Services.AddScoped<IHRJobPostingsRepository, HRJobPostingsRepository>();
builder.Services.AddScoped<ICandidateInterviewsRepository, CandidateInterviewsRepository>();
builder.Services.AddScoped<IParticipantRequestRepository, ParticipantRequestRepository>();
builder.Services.AddScoped<IMediaRepository, MediaRepository>();
builder.Services.AddScoped<ICandidateApplicationRepository, CandidateApplicationRepository>();

// Register Services
builder.Services.AddScoped<JwtTokenHelper>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IInterviewEmailService, InterviewEmailService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IAdminRoleService, AdminRoleService>();
builder.Services.AddScoped<IMediaService, MediaService>();
builder.Services.AddScoped<IDeptManagerDashboardService, DeptManagerDashboardService>();
builder.Services.AddScoped<IAdminDepartmentService, AdminDepartmentService>();
builder.Services.AddScoped<IAdminConfigService, AdminConfigService>();
builder.Services.AddScoped<IAdminWorkflowService, AdminWorkflowService>();
builder.Services.AddScoped<IDirectorService, DirectorService>();
builder.Services.AddScoped<IDeptManagerJobRequestsService, DeptManagerJobRequestsService>();
builder.Services.AddScoped<IDeptManagerInterviewsService, DeptManagerInterviewsService>();
builder.Services.AddScoped<IEmployeeInterviewsService, EmployeeInterviewsService>();
builder.Services.AddScoped<IHRStatisticsService, HRStatisticsService>();
builder.Services.AddScoped<IHRJobRequestsService, HRJobRequestsService>();
builder.Services.AddScoped<IHRApplicationsService, HRApplicationsService>();
builder.Services.AddScoped<IHRInterviewsService, HRInterviewsService>();
builder.Services.AddScoped<IInterviewConflictService, InterviewConflictService>();
builder.Services.AddScoped<IInterviewNoShowService, InterviewNoShowService>();
builder.Services.AddScoped<IInterviewMultiRoundService, InterviewMultiRoundService>();
builder.Services.AddScoped<IInterviewRoundSummaryService, InterviewRoundSummaryService>();
builder.Services.AddScoped<IInterviewFeedbackSubmissionService, InterviewFeedbackSubmissionService>();
builder.Services.AddScoped<IHROffersService, HROffersService>();
builder.Services.AddScoped<ICandidateOffersService, CandidateOffersService>();
builder.Services.AddScoped<IHRJobPostingsService, HRJobPostingsService>();
builder.Services.AddScoped<ICandidateInterviewsService, CandidateInterviewsService>();
builder.Services.AddScoped<IParticipantRequestService, ParticipantRequestService>();
builder.Services.AddScoped<ICandidateApplicationService, CandidateApplicationService>();

// ======================= BUILD APP =======================
var app = builder.Build();

// ======================= MIDDLEWARE =======================
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RMS API V1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AppCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();