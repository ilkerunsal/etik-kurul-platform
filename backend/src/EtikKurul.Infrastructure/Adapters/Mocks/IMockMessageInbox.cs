namespace EtikKurul.Infrastructure.Adapters.Mocks;

public interface IMockMessageInbox
{
    void CaptureEmail(string emailAddress, string subject, string body);

    void CaptureSms(string phoneNumber, string body);

    IReadOnlyList<MockMessageRecord> GetRecent(string? emailAddress, string? phoneNumber, int take = 10);
}
