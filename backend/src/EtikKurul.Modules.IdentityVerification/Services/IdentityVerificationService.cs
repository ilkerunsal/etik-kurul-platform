using System.Security.Cryptography;
using EtikKurul.Infrastructure.Abstractions;
using EtikKurul.Infrastructure.Adapters;
using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Options;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Infrastructure.Security;
using EtikKurul.Modules.IdentityVerification.Abstractions;
using EtikKurul.Modules.IdentityVerification.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EtikKurul.Modules.IdentityVerification.Services;

public class IdentityVerificationService(
    ApplicationDbContext dbContext,
    IFieldEncryptionService encryptionService,
    IIdentityVerificationProvider identityVerificationProvider,
    ISecretHashingService secretHashingService,
    ISmsProvider smsProvider,
    IEmailProvider emailProvider,
    IOptions<VerificationCodeOptions> verificationCodeOptions,
    TimeProvider timeProvider) : IIdentityVerificationService
{
    public async Task<VerifyIdentityResult> VerifyAsync(VerifyIdentityCommand command, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == command.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        if (user.AccountStatus is not AccountStatus.PendingIdentityCheck and not AccountStatus.IdentityFailed)
        {
            throw new ValidationAppException("Identity verification can only be performed for pending or failed users.");
        }

        var tckn = encryptionService.Decrypt(user.TcknEncrypted);
        var birthDate = DateOnly.ParseExact(encryptionService.Decrypt(user.BirthDateEncrypted), "yyyy-MM-dd");
        var providerResult = await identityVerificationProvider.VerifyAsync(
            new IdentityVerificationRequest(user.FirstName, user.LastName, tckn, birthDate),
            cancellationToken);

        var now = timeProvider.GetUtcNow();
        dbContext.UserIdentityChecks.Add(new UserIdentityCheck
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            ProviderName = providerResult.ProviderName,
            Success = providerResult.Success,
            ResponseCode = providerResult.ResponseCode,
            RequestHash = secretHashingService.ComputeSha256($"{user.Id}:{providerResult.ProviderName}:{tckn}:{birthDate:yyyy-MM-dd}"),
            ResultMaskedJson = SensitiveDataMasker.BuildIdentityCheckPayload(
                tckn,
                birthDate,
                providerResult.ProviderName,
                providerResult.ResponseCode,
                providerResult.Success),
            CheckedAt = now,
        });

        if (!providerResult.Success)
        {
            user.AccountStatus = AccountStatus.IdentityFailed;
            user.UpdatedAt = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            return new VerifyIdentityResult(user.Id, false, providerResult.ResponseCode, user.AccountStatus);
        }

        user.IsIdentityVerified = true;
        user.IdentityVerifiedAt = now;
        user.AccountStatus = AccountStatus.ContactPending;
        user.UpdatedAt = now;

        await CreateAndSendCodeAsync(user, ContactChannelType.Email, cancellationToken);
        await CreateAndSendCodeAsync(user, ContactChannelType.Sms, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        return new VerifyIdentityResult(user.Id, true, providerResult.ResponseCode, user.AccountStatus);
    }

    private async Task CreateAndSendCodeAsync(User user, ContactChannelType channelType, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var code = GenerateCode(verificationCodeOptions.Value.Length);

        dbContext.UserVerificationCodes.Add(new UserVerificationCode
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            ChannelType = channelType,
            CodeHash = secretHashingService.HashSecret(code),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(verificationCodeOptions.Value.ExpiresInMinutes),
        });

        if (channelType == ContactChannelType.Email)
        {
            await emailProvider.SendAsync(
                new EmailMessage(
                    user.Email,
                    "Etik Kurul Başvuru doğrulama kodu",
                    $"Doğrulama kodunuz: {code}"),
                cancellationToken);
            return;
        }

        await smsProvider.SendAsync(new SmsMessage(user.Phone, $"Doğrulama kodunuz: {code}"), cancellationToken);
    }

    private static string GenerateCode(int length)
    {
        var maxValue = (int)Math.Pow(10, length);
        return RandomNumberGenerator.GetInt32(0, maxValue).ToString($"D{length}");
    }
}
