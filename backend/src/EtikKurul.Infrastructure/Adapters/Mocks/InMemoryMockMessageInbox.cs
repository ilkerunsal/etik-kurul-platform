using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Infrastructure.Adapters.Mocks;

public class InMemoryMockMessageInbox(TimeProvider timeProvider) : IMockMessageInbox
{
    private readonly Lock _sync = new();
    private readonly List<MockMessageRecord> _messages = [];

    public void CaptureEmail(string emailAddress, string subject, string body)
    {
        Capture(ContactChannelType.Email, emailAddress, subject, body);
    }

    public void CaptureSms(string phoneNumber, string body)
    {
        Capture(ContactChannelType.Sms, phoneNumber, null, body);
    }

    public IReadOnlyList<MockMessageRecord> GetRecent(string? emailAddress, string? phoneNumber, int take = 10)
    {
        lock (_sync)
        {
            return _messages
                .Where(message =>
                    (message.ChannelType != ContactChannelType.Email || string.IsNullOrWhiteSpace(emailAddress) || string.Equals(message.Recipient, emailAddress, StringComparison.OrdinalIgnoreCase)) &&
                    (message.ChannelType != ContactChannelType.Sms || string.IsNullOrWhiteSpace(phoneNumber) || string.Equals(message.Recipient, phoneNumber, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(message => message.SentAt)
                .Take(take)
                .ToArray();
        }
    }

    private void Capture(ContactChannelType channelType, string recipient, string? subject, string body)
    {
        var record = new MockMessageRecord(
            Guid.NewGuid(),
            channelType,
            recipient,
            subject,
            body,
            timeProvider.GetUtcNow());

        lock (_sync)
        {
            _messages.Add(record);
            if (_messages.Count > 200)
            {
                _messages.RemoveRange(0, _messages.Count - 200);
            }
        }
    }
}
