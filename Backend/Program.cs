using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

// Add DbContext
builder.Services.AddDbContext<RecruitmentDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Controllers with JSON options to handle circular references
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Add CORS - Support both HTTP and HTTPS, configurable for production
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:5173", "https://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add JWT Authentication
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

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add HttpClient for Google OAuth
builder.Services.AddHttpClient();

// Add Memory Cache for OTP
builder.Services.AddMemoryCache();

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
builder.Services.AddScoped<IEmployeeInterviewsRepository, EmployeeInterviewsRepository>();

// Register Services
builder.Services.AddScoped<JwtTokenHelper>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IAdminRoleService, AdminRoleService>();
builder.Services.AddScoped<IAdminDepartmentService, AdminDepartmentService>();
builder.Services.AddScoped<IAdminConfigService, AdminConfigService>();
builder.Services.AddScoped<IAdminWorkflowService, AdminWorkflowService>();
builder.Services.AddScoped<IDirectorService, DirectorService>();
builder.Services.AddScoped<IDeptManagerJobRequestsService, DeptManagerJobRequestsService>();
builder.Services.AddScoped<IDeptManagerInterviewsService, DeptManagerInterviewsService>();
builder.Services.AddScoped<IDeptManagerDashboardService, DeptManagerDashboardService>();
builder.Services.AddScoped<IHRStatisticsService, HRStatisticsService>();
builder.Services.AddScoped<IHRJobRequestsService, HRJobRequestsService>();
builder.Services.AddScoped<IHRApplicationsService, HRApplicationsService>();
builder.Services.AddScoped<IHRInterviewsService, HRInterviewsService>();
builder.Services.AddScoped<IHROffersService, HROffersService>();
builder.Services.AddScoped<IHRJobPostingsService, HRJobPostingsService>();
builder.Services.AddScoped<IEmployeeInterviewsService, EmployeeInterviewsService>();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RMS API", Version = "v1" });
    
    // Custom schema IDs to avoid conflicts
    c.CustomSchemaIds(type => type.FullName);
    
    // Add JWT Authentication to Swagger
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

var app = builder.Build();

//// [TEMPORARY] Cập nhật password hash cho tất cả users & candidates = "123456" 
// using (var scope = app.Services.CreateScope())
// {
//     var dbContext = scope.ServiceProvider.GetRequiredService<RecruitmentDbContext>();
//     var passwordHash = PasswordHelper.HashPassword("123456");
    
//     // Update Users
//     var usersWithoutPassword = dbContext.Users
//         .Where(u => u.AuthProvider == "LOCAL" && (u.PasswordHash == null || u.PasswordHash == ""))
//         .ToList();
    
//     if (usersWithoutPassword.Any())
//     {
//         foreach (var user in usersWithoutPassword)
//         {
//             user.PasswordHash = passwordHash;
//         }
//         Console.WriteLine($"✓ Đã cập nhật password '123456' cho {usersWithoutPassword.Count} users");
//     }
    
//     // Update Candidates
//     var candidatesWithoutPassword = dbContext.Candidates
//         .Where(c => c.AuthProvider == "LOCAL" && (c.PasswordHash == null || c.PasswordHash == ""))
//         .ToList();
    
//     if (candidatesWithoutPassword.Any())
//     {
//         foreach (var candidate in candidatesWithoutPassword)
//         {
//             candidate.PasswordHash = passwordHash;
//         }
//         Console.WriteLine($"✓ Đã cập nhật password '123456' cho {candidatesWithoutPassword.Count} candidates");
//     }
    
//     if (usersWithoutPassword.Any() || candidatesWithoutPassword.Any())
//     {
//         dbContext.SaveChanges();
//     }
// }

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable HTTPS redirection
app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();