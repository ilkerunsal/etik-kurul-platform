using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.UserProfiles.Abstractions;
using EtikKurul.Modules.UserProfiles.Models;
using EtikKurul.Modules.UserProfiles.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EtikKurul.Modules.UserProfiles.Services;

public class ApplicationAccessEvaluator(
    ApplicationDbContext dbContext,
    IOptions<ApplicationAccessOptions> options) : IApplicationAccessEvaluator
{
    private readonly ApplicationAccessOptions _options = options.Value;

    public ApplicationAccessResult Evaluate(bool isAccountActive, int? profileCompletionPercent)
    {
        if (!isAccountActive)
        {
            return Build(false, "account_not_active", profileCompletionPercent);
        }

        if (!profileCompletionPercent.HasValue)
        {
            return Build(false, "profile_missing", null);
        }

        if (!_options.MinimumProfileCompletionPercent.HasValue)
        {
            return Build(false, "minimum_profile_completion_not_configured", profileCompletionPercent);
        }

        if (profileCompletionPercent.Value < _options.MinimumProfileCompletionPercent.Value)
        {
            return Build(false, "profile_completion_below_minimum", profileCompletionPercent);
        }

        return Build(true, "ready", profileCompletionPercent);
    }

    public async Task<ApplicationAccessResult> EvaluateAsync(Guid userId, CancellationToken cancellationToken)
    {
        var snapshot = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == userId)
            .Select(x => new
            {
                x.AccountStatus,
                ProfileCompletionPercent = x.Profile != null
                    ? (int?)x.Profile.ProfileCompletionPercent
                    : null,
            })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        return Evaluate(snapshot.AccountStatus == AccountStatus.Active, snapshot.ProfileCompletionPercent);
    }

    private ApplicationAccessResult Build(bool canOpenApplication, string reasonCode, int? currentProfileCompletionPercent)
        => new(
            canOpenApplication,
            reasonCode,
            currentProfileCompletionPercent,
            _options.MinimumProfileCompletionPercent);
}
