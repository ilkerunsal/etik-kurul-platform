using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record SendContactCodeCommand(Guid UserId, ContactChannelType ChannelType);
