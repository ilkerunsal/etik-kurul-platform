using EtikKurul.Infrastructure.Options;
using EtikKurul.Infrastructure.Security;
using Microsoft.Extensions.Options;

namespace EtikKurul.UnitTests.Infrastructure;

public class AesGcmFieldEncryptionServiceTests
{
    private const string Base64Key = "MDEyMzQ1Njc4OUFCQ0RFRjAxMjM0NTY3ODlBQkNERUY=";

    [Fact]
    public void Encrypt_And_Decrypt_RoundTrip()
    {
        var service = new AesGcmFieldEncryptionService(Options.Create(new EncryptionOptions { Base64Key = Base64Key }));

        var cipherText = service.Encrypt("12345678901");
        var plaintext = service.Decrypt(cipherText);

        Assert.NotEqual("12345678901", cipherText);
        Assert.Equal("12345678901", plaintext);
    }

    [Fact]
    public void Decrypt_WithWrongKey_Throws()
    {
        var encryptingService = new AesGcmFieldEncryptionService(Options.Create(new EncryptionOptions { Base64Key = Base64Key }));
        var decryptingService = new AesGcmFieldEncryptionService(
            Options.Create(new EncryptionOptions { Base64Key = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=" }));

        var cipherText = encryptingService.Encrypt("1989-05-17");

        Assert.ThrowsAny<Exception>(() => decryptingService.Decrypt(cipherText));
    }
}
