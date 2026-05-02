using System.Text;
using EtikKurul.Api.Authentication;
using EtikKurul.Infrastructure.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace EtikKurul.Api.Configuration;

public static class ProductionConfigurationValidator
{
    private const string DefaultEncryptionKey = "MDEyMzQ1Njc4OUFCQ0RFRjAxMjM0NTY3ODlBQkNERUY=";
    private const string DefaultJwtSigningKey = "change-this-signing-key-in-production-123456";

    public static void Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        var shouldRequireProductionSecrets = environment.IsProduction()
            || configuration.GetValue("Hosting:RequireProductionSecrets", false);

        if (!shouldRequireProductionSecrets)
        {
            return;
        }

        var failures = new List<string>();
        var jwtSigningKey = configuration[$"{JwtOptions.SectionName}:SigningKey"];
        var encryptionKey = configuration[$"{EncryptionOptions.SectionName}:Base64Key"];
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        var devEndpointsEnabled = configuration.GetValue("DevelopmentTools:EnableMockMessageEndpoints", false);

        if (string.IsNullOrWhiteSpace(jwtSigningKey)
            || jwtSigningKey == DefaultJwtSigningKey
            || Encoding.UTF8.GetByteCount(jwtSigningKey) < 64)
        {
            failures.Add("Jwt:SigningKey must be overridden with at least 64 bytes of non-default entropy.");
        }

        if (string.IsNullOrWhiteSpace(encryptionKey) || encryptionKey == DefaultEncryptionKey)
        {
            failures.Add("Encryption:Base64Key must be overridden with a non-default 128/192/256-bit key.");
        }
        else
        {
            try
            {
                var decodedKeyLength = Convert.FromBase64String(encryptionKey).Length;
                if (decodedKeyLength is not (16 or 24 or 32))
                {
                    failures.Add("Encryption:Base64Key must decode to 16, 24, or 32 bytes.");
                }
            }
            catch (FormatException)
            {
                failures.Add("Encryption:Base64Key must be valid Base64.");
            }
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            failures.Add("ConnectionStrings:DefaultConnection is required.");
        }
        else if (connectionString.Contains("Password=postgres", StringComparison.OrdinalIgnoreCase))
        {
            failures.Add("ConnectionStrings:DefaultConnection must not use the default postgres password.");
        }

        if (devEndpointsEnabled)
        {
            failures.Add("DevelopmentTools:EnableMockMessageEndpoints must be false.");
        }

        if (failures.Count > 0)
        {
            throw new InvalidOperationException(
                "Production configuration validation failed: " + string.Join(" ", failures));
        }
    }
}
