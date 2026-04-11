using Microsoft.Extensions.Logging;

namespace EtikKurul.Infrastructure.Adapters.Mocks;

public class MockSmsProvider(ILogger<MockSmsProvider> logger, IMockMessageInbox mockMessageInbox) : ISmsProvider
{
    public Task SendAsync(SmsMessage message, CancellationToken cancellationToken)
    {
        mockMessageInbox.CaptureSms(message.PhoneNumber, message.Body);
        logger.LogInformation("Mock SMS sent to {PhoneNumber}.", message.PhoneNumber);
        return Task.CompletedTask;
    }
}
