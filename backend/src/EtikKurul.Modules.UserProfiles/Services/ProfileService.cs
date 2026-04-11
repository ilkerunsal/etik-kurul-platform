using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.UserProfiles.Abstractions;
using EtikKurul.Modules.UserProfiles.Models;
using Microsoft.EntityFrameworkCore;

namespace EtikKurul.Modules.UserProfiles.Services;

public class ProfileService(
    ApplicationDbContext dbContext,
    ProfileCompletionCalculator completionCalculator) : IProfileService
{
    public async Task<GetProfileResult?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.UserProfiles
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new GetProfileResult(
                x.Id,
                x.UserId,
                x.AcademicTitle,
                x.DegreeLevel,
                x.InstitutionName,
                x.FacultyName,
                x.DepartmentName,
                x.PositionTitle,
                x.Biography,
                x.SpecializationSummary,
                x.HasESignature,
                x.KepAddress,
                x.CvDocumentId,
                x.ProfileCompletionPercent))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<GetProfileResult> UpdateAsync(UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == command.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        if (user.AccountStatus != AccountStatus.Active)
        {
            throw new ValidationAppException("Only active users can update a profile.");
        }

        var profile = await dbContext.UserProfiles.SingleOrDefaultAsync(x => x.UserId == command.UserId, cancellationToken)
            ?? throw new NotFoundAppException("Profile was not found for this user.");

        profile.AcademicTitle = command.AcademicTitle?.Trim();
        profile.DegreeLevel = command.DegreeLevel?.Trim();
        profile.InstitutionName = command.InstitutionName?.Trim();
        profile.FacultyName = command.FacultyName?.Trim();
        profile.DepartmentName = command.DepartmentName?.Trim();
        profile.PositionTitle = command.PositionTitle?.Trim();
        profile.Biography = command.Biography?.Trim();
        profile.SpecializationSummary = command.SpecializationSummary?.Trim();
        profile.HasESignature = command.HasESignature;
        profile.KepAddress = command.KepAddress?.Trim();
        profile.CvDocumentId = command.CvDocumentId;
        profile.ProfileCompletionPercent = completionCalculator.Calculate(command);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new GetProfileResult(
            profile.Id,
            profile.UserId,
            profile.AcademicTitle,
            profile.DegreeLevel,
            profile.InstitutionName,
            profile.FacultyName,
            profile.DepartmentName,
            profile.PositionTitle,
            profile.Biography,
            profile.SpecializationSummary,
            profile.HasESignature,
            profile.KepAddress,
            profile.CvDocumentId,
            profile.ProfileCompletionPercent);
    }

    public async Task<CreateProfileResult> CreateAsync(CreateProfileCommand command, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == command.UserId, cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        if (user.AccountStatus != AccountStatus.Active)
        {
            throw new ValidationAppException("Only active users can create a profile.");
        }

        if (await dbContext.UserProfiles.AnyAsync(x => x.UserId == command.UserId, cancellationToken))
        {
            throw new ConflictAppException("A profile already exists for this user.");
        }

        var completionPercent = completionCalculator.Calculate(command);
        var profile = new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = command.UserId,
            AcademicTitle = command.AcademicTitle?.Trim(),
            DegreeLevel = command.DegreeLevel?.Trim(),
            InstitutionName = command.InstitutionName?.Trim(),
            FacultyName = command.FacultyName?.Trim(),
            DepartmentName = command.DepartmentName?.Trim(),
            PositionTitle = command.PositionTitle?.Trim(),
            Biography = command.Biography?.Trim(),
            SpecializationSummary = command.SpecializationSummary?.Trim(),
            HasESignature = command.HasESignature,
            KepAddress = command.KepAddress?.Trim(),
            CvDocumentId = command.CvDocumentId,
            ProfileCompletionPercent = completionPercent,
        };

        dbContext.UserProfiles.Add(profile);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreateProfileResult(profile.Id, profile.UserId, profile.ProfileCompletionPercent);
    }
}
