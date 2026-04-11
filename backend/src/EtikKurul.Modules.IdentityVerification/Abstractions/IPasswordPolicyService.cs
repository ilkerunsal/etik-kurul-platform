namespace EtikKurul.Modules.IdentityVerification.Abstractions;

public interface IPasswordPolicyService
{
    void EnsurePasswordIsValid(string password);
}
