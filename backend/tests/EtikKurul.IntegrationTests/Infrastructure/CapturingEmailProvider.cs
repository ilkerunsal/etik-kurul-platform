using System.Text.RegularExpressions;
using EtikKurul.Infrastructure.Adapters;

namespace EtikKurul.IntegrationTests.Infrastructure;

public class CapturingEmailProvider : IEmailProvider
{
    private readonly List<EmailMessage> _messages = [];
    public IReadOnlyList<EmailMessage> Messages => _messages;

    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
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
