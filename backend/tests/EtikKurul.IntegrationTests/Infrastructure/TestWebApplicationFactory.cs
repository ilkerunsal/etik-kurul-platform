using System.IO;
using EtikKurul.Infrastructure.Adapters;
using EtikKurul.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace EtikKurul.IntegrationTests.Infrastructure;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"etik-kurul-tests-{Guid.NewGuid():N}";
    private readonly int? _minimumProfileCompletionPercent;
    private readonly IReadOnlyDictionary<string, string?> _extraConfiguration;

    public TestWebApplicationFactory()
        : this(null)
    {
    }

    internal TestWebApplicationFactory(
        int? minimumProfileCompletionPercent,
        IReadOnlyDictionary<string, string?>? extraConfiguration = null)
    {
        _minimumProfileCompletionPercent = minimumProfileCompletionPercent;
        _extraConfiguration = extraConfiguration ?? new Dictionary<string, string?>();
        Environment.SetEnvironmentVariable("Persistence__Provider", "InMemory");
        Environment.SetEnvironmentVariable("Persistence__InMemoryDatabaseName", _databaseName);
        Environment.SetEnvironmentVariable(
            "ApplicationAccess__MinimumProfileCompletionPercent",
            _minimumProfileCompletionPercent?.ToString());
    }

    public TestIdentityVerificationProvider IdentityProvider { get; } = new();
    public CapturingSmsProvider SmsProvider { get; } = new();
    public CapturingEmailProvider EmailProvider { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var contentRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "EtikKurul.Api"));

        builder.UseContentRoot(contentRoot);
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            var configuration = new Dictionary<string, string?>
            {
                ["Persistence:Provider"] = "InMemory",
                ["Persistence:InMemoryDatabaseName"] = _databaseName,
                ["ApplicationAccess:MinimumProfileCompletionPercent"] = _minimumProfileCompletionPercent?.ToString(),
            };

            foreach (var item in _extraConfiguration)
            {
                configuration[item.Key] = item.Value;
            }

            configBuilder.AddInMemoryCollection(configuration);
        });
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IIdentityVerificationProvider>();
            services.RemoveAll<ISmsProvider>();
            services.RemoveAll<IEmailProvider>();

            services.AddSingleton<IIdentityVerificationProvider>(IdentityProvider);
            services.AddSingleton<ISmsProvider>(SmsProvider);
            services.AddSingleton<IEmailProvider>(EmailProvider);

            using var scope = services.BuildServiceProvider().CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();
        });
    }

    protected override void Dispose(bool disposing)
    {
        Environment.SetEnvironmentVariable("Persistence__Provider", null);
        Environment.SetEnvironmentVariable("Persistence__InMemoryDatabaseName", null);
        Environment.SetEnvironmentVariable("ApplicationAccess__MinimumProfileCompletionPercent", null);
        base.Dispose(disposing);
    }
}
