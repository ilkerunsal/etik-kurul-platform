namespace EtikKurul.Infrastructure.Adapters;

public interface ISmsProvider
{
    Task SendAsync(SmsMessage message, CancellationToken cancellationToken);
}
