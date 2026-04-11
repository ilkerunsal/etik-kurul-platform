FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props NuGet.Config ./
COPY src/EtikKurul.Infrastructure/EtikKurul.Infrastructure.csproj src/EtikKurul.Infrastructure/
COPY src/EtikKurul.Modules.Applications/EtikKurul.Modules.Applications.csproj src/EtikKurul.Modules.Applications/
COPY src/EtikKurul.Modules.IdentityVerification/EtikKurul.Modules.IdentityVerification.csproj src/EtikKurul.Modules.IdentityVerification/
COPY src/EtikKurul.Modules.UserProfiles/EtikKurul.Modules.UserProfiles.csproj src/EtikKurul.Modules.UserProfiles/
COPY src/EtikKurul.Api/EtikKurul.Api.csproj src/EtikKurul.Api/

RUN dotnet restore src/EtikKurul.Api/EtikKurul.Api.csproj -p:UseProjectReferences=true

COPY src ./src

RUN dotnet publish src/EtikKurul.Api/EtikKurul.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false -p:UseProjectReferences=true

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "EtikKurul.Api.dll"]
