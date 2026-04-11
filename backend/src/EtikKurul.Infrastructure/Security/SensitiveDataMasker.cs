using System.Text.Json;

namespace EtikKurul.Infrastructure.Security;

public static class SensitiveDataMasker
{
    public static string MaskTckn(string tckn)
    {
        if (string.IsNullOrWhiteSpace(tckn))
        {
            return "***********";
        }

        return tckn.Length <= 4
            ? new string('*', tckn.Length)
            : $"{tckn[..3]}{new string('*', tckn.Length - 5)}{tckn[^2..]}";
    }

    public static string BuildIdentityCheckPayload(string tckn, DateOnly birthDate, string providerName, string responseCode, bool success)
    {
        return JsonSerializer.Serialize(new
        {
            providerName,
            responseCode,
            success,
            maskedTckn = MaskTckn(tckn),
            birthYear = birthDate.Year,
        });
    }
}
