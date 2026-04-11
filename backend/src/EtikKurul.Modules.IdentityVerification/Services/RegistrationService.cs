using EtikKurul.Infrastructure.Abstractions;
using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.IdentityVerification.Abstractions;
using EtikKurul.Modules.IdentityVerification.Models;
using Microsoft.EntityFrameworkCore;

namespace EtikKurul.Modules.IdentityVerification.Services;

public class RegistrationService(
    ApplicationDbContext dbContext,
    IPasswordPolicyService passwordPolicyService,
    ISecretHashingService secretHashingService,
    IFieldEncryptionService encryptionService,
    TimeProvider timeProvider) : IRegistrationService
{
    public async Task<RegisterUserResult> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        if (!command.Tckn.All(char.IsDigit) || command.Tckn.Length != 11)
        {
            throw new ValidationAppException("TCKN must consist of 11 digits.");
        }

        if (command.BirthDate >= DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime))
        {
            throw new ValidationAppException("Birth date must be in the past.");
        }

        passwordPolicyService.EnsurePasswordIsValid(command.Password);

        if (await dbContext.Users.AnyAsync(x => x.Email == command.Email, cancellationToken))
        {
            throw new ConflictAppException("A user with the same e-mail address already exists.");
        }

        if (await dbContext.Users.AnyAsync(x => x.Phone == command.Phone, cancellationToken))
        {
            throw new ConflictAppException("A user with the same phone number already exists.");
        }

        var researcherRole = await dbContext.Roles.SingleAsync(x => x.Code == "researcher", cancellationToken);
        var now = timeProvider.GetUtcNow();

        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            TcknEncrypted = encryptionService.Encrypt(command.Tckn),
            BirthDateEncrypted = encryptionService.Encrypt(command.BirthDate.ToString("yyyy-MM-dd")),
            Email = command.Email.Trim(),
            Phone = command.Phone.Trim(),
            PasswordHash = secretHashingService.HashSecret(command.Password),
            CreatedAt = now,
            UpdatedAt = now,
            UserRoles =
            [
                new UserRole
                {
                    Id = Guid.NewGuid(),
                    RoleId = researcherRole.Id,
                    Active = true,
                    AssignedAt = now,
                },
            ],
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new RegisterUserResult(user.Id, user.AccountStatus);
    }
}
