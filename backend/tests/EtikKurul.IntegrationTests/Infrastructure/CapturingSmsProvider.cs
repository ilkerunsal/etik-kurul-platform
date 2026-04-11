using System.Text.RegularExpressions;
using EtikKurul.Infrastructure.Adapters;

namespace EtikKurul.IntegrationTests.Infrastructure;

public class CapturingSmsProvider : ISmsProvider
{
    private readonly List<SmsMessage> _messages = [];
    public IReadOnlyList<SmsMessage> Messages => _messages;

    public Task SendAsync(SmsMessage message, CancellationToken cancellationToken)
    {
        _messages.Add(message);
        return Task.CompletedTask;
    }

    public string ExtractLatestCode()
    {
        var body = _messages.Last().Body;
        return Regex.Match(body, @"\d{6}").Value;
    }
}
