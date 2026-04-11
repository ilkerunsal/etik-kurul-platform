using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record ConfirmContactCodeCommand(Guid UserId, ContactChannelType ChannelType, string Code);
