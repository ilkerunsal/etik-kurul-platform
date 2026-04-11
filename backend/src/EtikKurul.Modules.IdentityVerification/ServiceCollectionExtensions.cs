using EtikKurul.Modules.IdentityVerification.Abstractions;
using EtikKurul.Modules.IdentityVerification.Services;
using Microsoft.Extensions.DependencyInjection;

namespace EtikKurul.Modules.IdentityVerification;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddIdentityVerificationModule(this IServiceCollection services)
    {
        services.AddScoped<IPasswordPolicyService, PasswordPolicyService>();
        services.AddScoped<IRegistrationService, RegistrationService>();
        services.AddScoped<IIdentityVerificationService, IdentityVerificationService>();
        services.AddScoped<IContactVerificationService, ContactVerificationService>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        return services;
    }
}
