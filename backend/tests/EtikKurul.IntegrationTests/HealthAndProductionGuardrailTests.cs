using System.Net.Http.Json;
using EtikKurul.Api.Configuration;
using EtikKurul.IntegrationTests.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace EtikKurul.IntegrationTests;

public class HealthAndProductionGuardrailTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public HealthAndProductionGuardrailTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HealthEndpoints_ReturnOperationalStatusPayloads()
    {
        var client = _factory.CreateClient();

        var liveResponse = await client.GetAsync("/health/live");
        var readyResponse = await client.GetAsync("/health/ready");

        liveResponse.EnsureSuccessStatusCode();
        readyResponse.EnsureSuccessStatusCode();

        var livePayload = await liveResponse.Content.ReadFromJsonAsync<HealthPayload>();
        var readyPayload = await readyResponse.Content.ReadFromJsonAsync<HealthPayload>();

        Assert.NotNull(livePayload);
        Assert.Equal("Healthy", livePayload!.Status);
        Assert.Contains(livePayload.Checks, check => check.Name == "self" && check.Status == "Healthy");

        Assert.NotNull(readyPayload);
        Assert.Equal("Healthy", readyPayload!.Status);
        Assert.Contains(readyPayload.Checks, check => check.Name == "database" && check.Status == "Healthy");
    }

    [Fact]
    public void ProductionConfigurationValidator_RejectsDefaultSecrets_WhenProductionModeIsRequired()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Hosting:RequireProductionSecrets"] = "true",
                ["Jwt:SigningKey"] = "change-this-signing-key-in-production-123456",
                ["Encryption:Base64Key"] = "MDEyMzQ1Njc4OUFCQ0RFRjAxMjM0NTY3ODlBQkNERUY=",
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=etik;Username=postgres;Password=postgres",
                ["DevelopmentTools:EnableMockMessageEndpoints"] = "true",
            })
            .Build();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            ProductionConfigurationValidator.Validate(configuration, new TestHostEnvironment("Development")));

        Assert.Contains("Production configuration validation failed", exception.Message);
        Assert.Contains("Jwt:SigningKey", exception.Message);
        Assert.Contains("Encryption:Base64Key", exception.Message);
        Assert.Contains("DefaultConnection", exception.Message);
        Assert.Contains("DevelopmentTools:EnableMockMessageEndpoints", exception.Message);
    }

    [Fact]
    public void ProductionConfigurationValidator_AllowsStrongSecrets_WhenProductionModeIsRequired()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Hosting:RequireProductionSecrets"] = "true",
                ["Jwt:SigningKey"] = "prod-signing-key-with-at-least-sixty-four-bytes-of-entropy-0123456789",
                ["Encryption:Base64Key"] = Convert.ToBase64String("ABCDEF0123456789ABCDEF0123456789"u8.ToArray()),
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=etik;Username=etik_app;Password=not-the-default-password",
                ["DevelopmentTools:EnableMockMessageEndpoints"] = "false",
            })
            .Build();

        ProductionConfigurationValidator.Validate(configuration, new TestHostEnvironment("Development"));
    }

    private sealed record HealthPayload(string Status, HealthCheckPayload[] Checks);

    private sealed record HealthCheckPayload(string Name, string Status);

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public TestHostEnvironment(string environmentName)
        {
            EnvironmentName = environmentName;
        }

        public string EnvironmentName { get; set; }

        public string ApplicationName { get; set; } = "EtikKurul.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
