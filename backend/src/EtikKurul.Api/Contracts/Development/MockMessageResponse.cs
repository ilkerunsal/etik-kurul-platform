using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Development;

public sealed record MockMessageResponse(
    Guid Id,
    ContactChannelType ChannelType,
    string Recipient,
    string? Subject,
    string Body,
    string? Code,
    DateTimeOffset SentAt);
