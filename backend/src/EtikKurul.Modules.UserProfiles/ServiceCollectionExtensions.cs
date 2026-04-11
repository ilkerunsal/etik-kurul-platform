using EtikKurul.Modules.UserProfiles.Abstractions;
using EtikKurul.Modules.UserProfiles.Options;
using EtikKurul.Modules.UserProfiles.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace EtikKurul.Modules.UserProfiles;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddUserProfilesModule(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<ApplicationAccessOptions>()
            .Configure(options =>
            {
                var rawValue = configuration[$"{ApplicationAccessOptions.SectionName}:MinimumProfileCompletionPercent"];
                options.MinimumProfileCompletionPercent = int.TryParse(rawValue, out var value)
                    ? value
                    : null;
            });
        services.AddScoped<ProfileCompletionCalculator>();
        services.AddScoped<IApplicationAccessEvaluator, ApplicationAccessEvaluator>();
        services.AddScoped<IProfileService, ProfileService>();
        return services;
    }
}
