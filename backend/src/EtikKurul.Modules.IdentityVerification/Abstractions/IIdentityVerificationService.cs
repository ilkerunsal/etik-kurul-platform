using EtikKurul.Modules.IdentityVerification.Models;

namespace EtikKurul.Modules.IdentityVerification.Abstractions;

public interface IIdentityVerificationService
{
    Task<VerifyIdentityResult> VerifyAsync(VerifyIdentityCommand command, CancellationToken cancellationToken);
}
