using EtikKurul.Modules.IdentityVerification.Models;

namespace EtikKurul.Modules.IdentityVerification.Abstractions;

public interface IContactVerificationService
{
    Task<SendContactCodeResult> SendCodeAsync(SendContactCodeCommand command, CancellationToken cancellationToken);
    Task<ConfirmContactCodeResult> ConfirmCodeAsync(ConfirmContactCodeCommand command, CancellationToken cancellationToken);
}
