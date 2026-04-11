namespace EtikKurul.Infrastructure.Options;

public class EncryptionOptions
{
    public const string SectionName = "Encryption";

    public string Base64Key { get; set; } = string.Empty;
}
