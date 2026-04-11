using EtikKurul.Modules.IdentityVerification.Models;

namespace EtikKurul.Modules.IdentityVerification.Abstractions;

public interface IRegistrationService
{
    Task<RegisterUserResult> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken);
}
