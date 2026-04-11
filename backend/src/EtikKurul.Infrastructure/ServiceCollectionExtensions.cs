using EtikKurul.Infrastructure.Abstractions;
using EtikKurul.Infrastructure.Adapters;
using EtikKurul.Infrastructure.Adapters.Mocks;
using EtikKurul.Infrastructure.Options;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EtikKurul.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<EncryptionOptions>(configuration.GetSection(EncryptionOptions.SectionName));
        services.Configure<VerificationCodeOptions>(configuration.GetSection(VerificationCodeOptions.SectionName));
        services.Configure<MockIdentityVerificationOptions>(configuration.GetSection(MockIdentityVerificationOptions.SectionName));
        services.Configure<DevelopmentToolsOptions>(configuration.GetSection(DevelopmentToolsOptions.SectionName));

        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IFieldEncryptionService, AesGcmFieldEncryptionService>();
        services.AddSingleton<ISecretHashingService, Pbkdf2SecretHashingService>();
        services.AddSingleton<IMockMessageInbox, InMemoryMockMessageInbox>();

        services.AddScoped<IIdentityVerificationProvider, MockIdentityVerificationProvider>();
        services.AddScoped<ISmsProvider, MockSmsProvider>();
        services.AddScoped<IEmailProvider, MockEmailProvider>();

        services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
        {
            var effectiveConfiguration = serviceProvider.GetRequiredService<IConfiguration>();
            var persistenceProvider =
                effectiveConfiguration["Persistence:Provider"] ??
                Environment.GetEnvironmentVariable("Persistence__Provider");
            var inMemoryDatabaseName =
                effectiveConfiguration["Persistence:InMemoryDatabaseName"] ??
                Environment.GetEnvironmentVariable("Persistence__InMemoryDatabaseName") ??
                "etik-kurul-tests";

            if (string.Equals(persistenceProvider, "InMemory", StringComparison.OrdinalIgnoreCase))
            {
                ConfigureInMemory(options, inMemoryDatabaseName);
                return;
            }

            ConfigureNpgsql(options, effectiveConfiguration);
        });

        return services;
    }

    private static void ConfigureInMemory(DbContextOptionsBuilder options, string databaseName)
    {
        options.UseInMemoryDatabase(databaseName);
    }

    private static void ConfigureNpgsql(DbContextOptionsBuilder options, IConfiguration configuration)
    {
        options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));
    }
}
