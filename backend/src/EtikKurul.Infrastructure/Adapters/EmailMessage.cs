namespace EtikKurul.Infrastructure.Adapters;

public sealed record EmailMessage(string EmailAddress, string Subject, string Body);
