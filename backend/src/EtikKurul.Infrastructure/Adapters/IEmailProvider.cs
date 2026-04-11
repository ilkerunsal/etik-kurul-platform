namespace EtikKurul.Infrastructure.Adapters;

public interface IEmailProvider
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken);
}
