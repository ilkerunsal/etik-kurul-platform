using System.Security.Cryptography;
using EtikKurul.Infrastructure.Abstractions;
using EtikKurul.Infrastructure.Adapters;
using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Options;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.IdentityVerification.Abstractions;
using EtikKurul.Modules.IdentityVerification.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EtikKurul.Modules.IdentityVerification.Services;

public class ContactVerificationService(
    ApplicationDbContext dbContext,
    ISecretHashingService secretHashingService,
    ISmsProvider smsProvider,
    IEmailProvider emailProvider,
    IOptions<VerificationCodeOptions> verificationCodeOptions,
    TimeProvider timeProvider) : IContactVerificationService
{
    public async Task<SendContactCodeResult> SendCodeAsync(SendContactCodeCommand command, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == command.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        if (user.AccountStatus != AccountStatus.ContactPending)
        {
            throw new ValidationAppException("Verification codes can only be sent while contact verification is pending.");
        }

        var now = timeProvider.GetUtcNow();
        var code = GenerateCode(verificationCodeOptions.Value.Length);
        var expiresAt = now.AddMinutes(verificationCodeOptions.Value.ExpiresInMinutes);

        dbContext.UserVerificationCodes.Add(new UserVerificationCode
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            ChannelType = command.ChannelType,
            CodeHash = secretHashingService.HashSecret(code),
            ExpiresAt = expiresAt,
            CreatedAt = now,
        });

        user.UpdatedAt = now;

        if (command.ChannelType == ContactChannelType.Email)
        {
            await emailProvider.SendAsync(
                new EmailMessage(
                    user.Email,
                    "Etik Kurul Başvuru doğrulama kodu",
                    $"Doğrulama kodunuz: {code}"),
                cancellationToken);
        }
        else
        {
            await smsProvider.SendAsync(new SmsMessage(user.Phone, $"Doğrulama kodunuz: {code}"), cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new SendContactCodeResult(user.Id, command.ChannelType, expiresAt, user.AccountStatus);
    }

    public async Task<ConfirmContactCodeResult> ConfirmCodeAsync(ConfirmContactCodeCommand command, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == command.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        if (user.AccountStatus is not AccountStatus.ContactPending and not AccountStatus.Active)
        {
            throw new ValidationAppException("Contact code confirmation is not available for the current account status.");
        }

        var now = timeProvider.GetUtcNow();
        var candidates = await dbContext.UserVerificationCodes
            .Where(x =>
                x.UserId == command.UserId &&
                x.ChannelType == command.ChannelType &&
                x.UsedAt == null &&
                x.ExpiresAt >= now)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var matchingCode = candidates.FirstOrDefault(x => secretHashingService.VerifySecret(x.CodeHash, command.Code));
        if (matchingCode is null)
        {
            throw new ValidationAppException("Verification code is invalid or expired.");
        }

        matchingCode.UsedAt = now;
        if (command.ChannelType == ContactChannelType.Email)
        {
            user.EmailVerified = true;
        }
        else
        {
            user.PhoneVerified = true;
        }

        if (user.EmailVerified || user.PhoneVerified)
        {
            user.AccountStatus = AccountStatus.Active;
        }

        user.UpdatedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ConfirmContactCodeResult(
            user.Id,
            command.ChannelType,
            true,
            user.EmailVerified,
            user.PhoneVerified,
            user.AccountStatus);
    }

    private static string GenerateCode(int length)
    {
        var maxValue = (int)Math.Pow(10, length);
        return RandomNumberGenerator.GetInt32(0, maxValue).ToString($"D{length}");
    }
}
