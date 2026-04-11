namespace EtikKurul.Infrastructure.Abstractions;

public interface IFieldEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}
