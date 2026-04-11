using System.Text.Json;

namespace EtikKurul.Api.Contracts.Applications;

public sealed record SaveApplicationFormRequest(int VersionNo, JsonElement Data, int CompletionPercent);
