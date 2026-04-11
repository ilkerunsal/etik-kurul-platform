using System.Security.Cryptography;
using System.Text;
using EtikKurul.Infrastructure.Abstractions;
using EtikKurul.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace EtikKurul.Infrastructure.Security;

public class AesGcmFieldEncryptionService(IOptions<EncryptionOptions> options) : IFieldEncryptionService
{
    private const string Version = "v1";
    private readonly byte[] _key = ParseKey(options.Value.Base64Key);

    public string Encrypt(string plaintext)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(plaintext);

        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(12);
        var cipherText = new byte[plaintextBytes.Length];
        var tag = new byte[16];

        using var aesGcm = new AesGcm(_key, 16);
        aesGcm.Encrypt(nonce, plaintextBytes, cipherText, tag);

        return string.Join(
            '.',
            Version,
            Convert.ToBase64String(nonce),
            Convert.ToBase64String(cipherText),
            Convert.ToBase64String(tag));
    }

    public string Decrypt(string ciphertext)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(ciphertext);

        var parts = ciphertext.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 4 || !string.Equals(parts[0], Version, StringComparison.Ordinal))
        {
            throw new CryptographicException("Encrypted payload format is invalid.");
        }

        var nonce = Convert.FromBase64String(parts[1]);
        var cipherBytes = Convert.FromBase64String(parts[2]);
        var tag = Convert.FromBase64String(parts[3]);
        var plaintextBytes = new byte[cipherBytes.Length];

        using var aesGcm = new AesGcm(_key, 16);
        aesGcm.Decrypt(nonce, cipherBytes, tag, plaintextBytes);

        return Encoding.UTF8.GetString(plaintextBytes);
    }

    private static byte[] ParseKey(string base64Key)
    {
        if (string.IsNullOrWhiteSpace(base64Key))
        {
            throw new InvalidOperationException("Encryption:Base64Key configuration is required.");
        }

        var key = Convert.FromBase64String(base64Key);
        if (key.Length is not (16 or 24 or 32))
        {
            throw new InvalidOperationException("Encryption key must be 128, 192, or 256 bits.");
        }

        return key;
    }
}
