using EtikKurul.Modules.UserProfiles.Options;
using EtikKurul.Modules.UserProfiles.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using EtikKurul.Infrastructure.Persistence;

namespace EtikKurul.UnitTests.Modules;

public class ApplicationAccessEvaluatorTests
{
    [Fact]
    public void Evaluate_ReturnsProfileMissing_WhenProfileDoesNotExist()
    {
        var evaluator = CreateEvaluator(minimumProfileCompletionPercent: 100);

        var result = evaluator.Evaluate(isAccountActive: true, profileCompletionPercent: null);

        Assert.False(result.CanOpenApplication);
        Assert.Equal("profile_missing", result.ReasonCode);
    }

    [Fact]
    public void Evaluate_ReturnsConfigurationMissing_WhenThresholdIsNotConfigured()
    {
        var evaluator = CreateEvaluator(minimumProfileCompletionPercent: null);

        var result = evaluator.Evaluate(isAccountActive: true, profileCompletionPercent: 100);

        Assert.False(result.CanOpenApplication);
        Assert.Equal("minimum_profile_completion_not_configured", result.ReasonCode);
    }

    [Fact]
    public void Evaluate_ReturnsBelowMinimum_WhenCompletionIsLowerThanConfiguredThreshold()
    {
        var evaluator = CreateEvaluator(minimumProfileCompletionPercent: 95);

        var result = evaluator.Evaluate(isAccountActive: true, profileCompletionPercent: 91);

        Assert.False(result.CanOpenApplication);
        Assert.Equal("profile_completion_below_minimum", result.ReasonCode);
    }

    [Fact]
    public void Evaluate_ReturnsReady_WhenCompletionMeetsConfiguredThreshold()
    {
        var evaluator = CreateEvaluator(minimumProfileCompletionPercent: 90);

        var result = evaluator.Evaluate(isAccountActive: true, profileCompletionPercent: 100);

        Assert.True(result.CanOpenApplication);
        Assert.Equal("ready", result.ReasonCode);
    }

    private static ApplicationAccessEvaluator CreateEvaluator(int? minimumProfileCompletionPercent)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        var dbContext = new ApplicationDbContext(options);
        return new ApplicationAccessEvaluator(
            dbContext,
            Options.Create(new ApplicationAccessOptions
            {
                MinimumProfileCompletionPercent = minimumProfileCompletionPercent,
            }));
    }
}
