using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record ConfirmContactCodeResult(
    Guid UserId,
    ContactChannelType ChannelType,
    bool ChannelVerified,
    bool EmailVerified,
    bool PhoneVerified,
    AccountStatus AccountStatus);
