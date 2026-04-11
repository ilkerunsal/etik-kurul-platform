using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Modules.IdentityVerification.Services;

namespace EtikKurul.UnitTests.Modules;

public class PasswordPolicyServiceTests
{
    [Fact]
    public void EnsurePasswordIsValid_RejectsWeakPasswords()
    {
        var service = new PasswordPolicyService();
        Assert.Throws<ValidationAppException>(() => service.EnsurePasswordIsValid("weak"));
    }
}
