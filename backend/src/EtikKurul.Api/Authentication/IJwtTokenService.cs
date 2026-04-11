using EtikKurul.Modules.IdentityVerification.Models;

namespace EtikKurul.Api.Authentication;

public interface IJwtTokenService
{
    (string AccessToken, DateTimeOffset ExpiresAt) CreateAccessToken(AuthenticatedUserResult user);
}
