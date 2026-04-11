using EtikKurul.Modules.Applications.Abstractions;
using EtikKurul.Modules.Applications.Services;
using Microsoft.Extensions.DependencyInjection;

namespace EtikKurul.Modules.Applications;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationsModule(this IServiceCollection services)
    {
        services.AddScoped<ApplicationValidationBaseEvaluator>();
        services.AddScoped<IApplicationService, ApplicationService>();
        return services;
    }
}
