using EtikKurul.Infrastructure.Security;

namespace EtikKurul.UnitTests.Infrastructure;

public class Pbkdf2SecretHashingServiceTests
{
    [Fact]
    public void VerifySecret_ReturnsTrue_ForMatchingSecret()
    {
        var service = new Pbkdf2SecretHashingService();
        var hash = service.HashSecret("Password1");

        Assert.True(service.VerifySecret(hash, "Password1"));
        Assert.False(service.VerifySecret(hash, "Password2"));
    }
}
