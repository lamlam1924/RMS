using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RMS.Common;
using RMS.Data;
using RMS.Repository;
using RMS.Service;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext
builder.Services.AddDbContext<RecruitmentDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Controllers
builder.Services.AddControllers();

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

// Add HttpClient for Google OAuth
builder.Services.AddHttpClient();

// Add Memory Cache for OTP
builder.Services.AddMemoryCache();

//Register Repositories
builder.Services.AddScoped<IAuthRepository, AuthRepository>();

// Register Services
builder.Services.AddScoped<JwtTokenHelper>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RMS API", Version = "v1" });
    
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

//// [TEMPORARY] Cập nhật password hash cho tất cả users = "123456" 

// using (var scope = app.Services.CreateScope())
// {
//     var dbContext = scope.ServiceProvider.GetRequiredService<RecruitmentDbContext>();
//     var passwordHash = PasswordHelper.HashPassword("123456");
    
//     var usersWithoutPassword = dbContext.Users
//         .Where(u => u.AuthProvider == "LOCAL" && (u.PasswordHash == null || u.PasswordHash == ""))
//         .ToList();
    
//     if (usersWithoutPassword.Any())
//     {
//         foreach (var user in usersWithoutPassword)
//         {
//             user.PasswordHash = passwordHash;
//         }
//         dbContext.SaveChanges();
//         Console.WriteLine($"✓ Đã cập nhật password '123456' cho {usersWithoutPassword.Count} users");
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