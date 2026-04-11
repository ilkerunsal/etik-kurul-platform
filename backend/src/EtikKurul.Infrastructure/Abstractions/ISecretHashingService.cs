namespace EtikKurul.Infrastructure.Abstractions;

public interface ISecretHashingService
{
    string HashSecret(string secret);
    bool VerifySecret(string hash, string secret);
    string ComputeSha256(string value);
}
