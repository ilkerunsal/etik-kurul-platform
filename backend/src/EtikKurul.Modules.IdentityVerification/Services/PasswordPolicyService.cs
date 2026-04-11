using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Modules.IdentityVerification.Abstractions;

namespace EtikKurul.Modules.IdentityVerification.Services;

public class PasswordPolicyService : IPasswordPolicyService
{
    public void EnsurePasswordIsValid(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            throw new ValidationAppException("Password must be at least 8 characters long.");
        }

        if (!password.Any(char.IsUpper))
        {
            throw new ValidationAppException("Password must include at least one uppercase character.");
        }

        if (!password.Any(char.IsLower))
        {
            throw new ValidationAppException("Password must include at least one lowercase character.");
        }

        if (!password.Any(char.IsDigit))
        {
            throw new ValidationAppException("Password must include at least one digit.");
        }
    }
}
