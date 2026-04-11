using EtikKurul.Infrastructure.Security;

namespace EtikKurul.UnitTests.Infrastructure;

public class SensitiveDataMaskerTests
{
    [Fact]
    public void BuildIdentityCheckPayload_DoesNotExposeRawSensitiveFields()
    {
        var payload = SensitiveDataMasker.BuildIdentityCheckPayload(
            "12345678901",
            new DateOnly(1989, 5, 17),
            "mock_nvi",
            "mock_match",
            true);

        Assert.DoesNotContain("12345678901", payload);
        Assert.DoesNotContain("1989-05-17", payload);
        Assert.Contains("1989", payload);
    }
}
