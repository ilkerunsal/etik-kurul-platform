namespace EtikKurul.Api.Contracts.Auth;

public sealed record LoginResponse(string AccessToken, DateTimeOffset ExpiresAt, SessionUserResponse User);
