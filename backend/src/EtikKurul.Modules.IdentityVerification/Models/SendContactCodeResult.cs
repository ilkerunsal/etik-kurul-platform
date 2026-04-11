using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record SendContactCodeResult(Guid UserId, ContactChannelType ChannelType, DateTimeOffset ExpiresAt, AccountStatus AccountStatus);
