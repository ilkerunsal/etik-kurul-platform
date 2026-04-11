using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Infrastructure.Adapters.Mocks;

public sealed record MockMessageRecord(
    Guid Id,
    ContactChannelType ChannelType,
    string Recipient,
    string? Subject,
    string Body,
    DateTimeOffset SentAt);
