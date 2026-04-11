using Microsoft.Extensions.Logging;

namespace EtikKurul.Infrastructure.Adapters.Mocks;

public class MockEmailProvider(ILogger<MockEmailProvider> logger, IMockMessageInbox mockMessageInbox) : IEmailProvider
{
    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        mockMessageInbox.CaptureEmail(message.EmailAddress, message.Subject, message.Body);
        logger.LogInformation("Mock e-mail sent to {EmailAddress}.", message.EmailAddress);
        return Task.CompletedTask;
    }
}
