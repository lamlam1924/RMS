dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.11


dotnet ef dbcontext scaffold "Server=localhost;Database=RecruitmentDB;User Id=sa;Password=123;TrustServerCertificate=True" Microsoft.EntityFrameworkCore.SqlServer --context-dir Data --output-dir Entity --context RecruitmentDbContext --no-onconfiguring --force


--Setup HTTPS cho người mới (1 lần/máy)
 dotnet dev-certs https --trust

dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
 ---------------------------------
 

docker build -t rms-be .

docker run -p 8080:8080 rms-be

docker ps
docker stop <container_id>
docker rm <container_id>

