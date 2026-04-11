using EtikKurul.Modules.UserProfiles.Models;

namespace EtikKurul.Modules.UserProfiles.Abstractions;

public interface IApplicationAccessEvaluator
{
    ApplicationAccessResult Evaluate(bool isAccountActive, int? profileCompletionPercent);

    Task<ApplicationAccessResult> EvaluateAsync(Guid userId, CancellationToken cancellationToken);
}
