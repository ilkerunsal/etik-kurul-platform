using EtikKurul.Infrastructure.Abstractions;
using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.IdentityVerification.Abstractions;
using EtikKurul.Modules.IdentityVerification.Models;
using Microsoft.EntityFrameworkCore;

namespace EtikKurul.Modules.IdentityVerification.Services;

public class AuthenticationService(
    ApplicationDbContext dbContext,
    ISecretHashingService secretHashingService) : IAuthenticationService
{
    public async Task<AuthenticatedUserResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken)
    {
        var emailOrPhone = command.EmailOrPhone.Trim();
        var user = await QueryUsers()
            .SingleOrDefaultAsync(
                x => x.Email == emailOrPhone || x.Phone == emailOrPhone,
                cancellationToken)
            ?? throw new ValidationAppException("Invalid credentials.");

        if (user.AccountStatus != AccountStatus.Active)
        {
            throw new ValidationAppException("Only active users can log in.");
        }

        if (!secretHashingService.VerifySecret(user.PasswordHash, command.Password))
        {
            throw new ValidationAppException("Invalid credentials.");
        }

        return Map(user);
    }

    public async Task<AuthenticatedUserResult> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await QueryUsers()
            .SingleOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        return Map(user);
    }

    private IQueryable<User> QueryUsers()
    {
        return dbContext.Users
            .Include(x => x.Profile)
            .Include(x => x.UserRoles.Where(role => role.Active))
            .ThenInclude(x => x.Role);
    }

    private static AuthenticatedUserResult Map(User user)
    {
        var roles = user.UserRoles
            .Where(x => x.Active)
            .Select(x => x.Role.Code)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(x => x, StringComparer.Ordinal)
            .ToArray();

        return new AuthenticatedUserResult(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.Phone,
            user.AccountStatus switch
            {
                AccountStatus.PendingIdentityCheck => "pending_identity_check",
                AccountStatus.IdentityFailed => "identity_failed",
                AccountStatus.ContactPending => "contact_pending",
                AccountStatus.Active => "active",
                AccountStatus.Suspended => "suspended",
                AccountStatus.Archived => "archived",
                _ => throw new InvalidOperationException("Unsupported account status."),
            },
            user.IsIdentityVerified,
            user.EmailVerified,
            user.PhoneVerified,
            user.Profile?.ProfileCompletionPercent,
            roles);
    }
}
