namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record LoginCommand(string EmailOrPhone, string Password);
