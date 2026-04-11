using EtikKurul.Modules.IdentityVerification.Models;

namespace EtikKurul.Modules.IdentityVerification.Abstractions;

public interface IAuthenticationService
{
    Task<AuthenticatedUserResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken);

    Task<AuthenticatedUserResult> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken);
}
