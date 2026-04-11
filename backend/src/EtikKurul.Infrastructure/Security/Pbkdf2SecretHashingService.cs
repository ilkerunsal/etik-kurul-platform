using System.Security.Cryptography;
using System.Text;
using EtikKurul.Infrastructure.Abstractions;

namespace EtikKurul.Infrastructure.Security;

public class Pbkdf2SecretHashingService : ISecretHashingService
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int IterationCount = 100_000;
    private const string Prefix = "pbkdf2-sha256";

    public string HashSecret(string secret)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secret);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(secret, salt, IterationCount, HashAlgorithmName.SHA256, HashSize);

        return string.Join(
            '$',
            Prefix,
            IterationCount.ToString(),
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool VerifySecret(string hash, string secret)
    {
        if (string.IsNullOrWhiteSpace(hash) || string.IsNullOrWhiteSpace(secret))
        {
            return false;
        }

        var parts = hash.Split('$', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 4 || !string.Equals(parts[0], Prefix, StringComparison.Ordinal))
        {
            return false;
        }

        if (!int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        var salt = Convert.FromBase64String(parts[2]);
        var storedHash = Convert.FromBase64String(parts[3]);
        var candidate = Rfc2898DeriveBytes.Pbkdf2(secret, salt, iterations, HashAlgorithmName.SHA256, storedHash.Length);

        return CryptographicOperations.FixedTimeEquals(storedHash, candidate);
    }

    public string ComputeSha256(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    }
}
