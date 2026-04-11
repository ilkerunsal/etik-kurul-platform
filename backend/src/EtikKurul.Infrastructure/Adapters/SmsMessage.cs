namespace EtikKurul.Infrastructure.Adapters;

public sealed record SmsMessage(string PhoneNumber, string Body);
