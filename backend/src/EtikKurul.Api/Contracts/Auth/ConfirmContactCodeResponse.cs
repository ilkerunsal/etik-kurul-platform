using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Auth;

public sealed record ConfirmContactCodeResponse(
    Guid UserId,
    ContactChannelType ChannelType,
    bool ChannelVerified,
    bool EmailVerified,
    bool PhoneVerified,
    AccountStatus AccountStatus);
