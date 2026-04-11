using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Auth;

public sealed record SendContactCodeResponse(Guid UserId, ContactChannelType ChannelType, DateTimeOffset ExpiresAt, AccountStatus AccountStatus);
