using EtikKurul.Modules.UserProfiles.Models;

namespace EtikKurul.Modules.UserProfiles.Services;

public class ProfileCompletionCalculator
{
    public int Calculate(CreateProfileCommand command)
        => Calculate(
            command.AcademicTitle,
            command.DegreeLevel,
            command.InstitutionName,
            command.FacultyName,
            command.DepartmentName,
            command.PositionTitle,
            command.Biography,
            command.SpecializationSummary,
            command.KepAddress,
            command.CvDocumentId);

    public int Calculate(UpdateProfileCommand command)
        => Calculate(
            command.AcademicTitle,
            command.DegreeLevel,
            command.InstitutionName,
            command.FacultyName,
            command.DepartmentName,
            command.PositionTitle,
            command.Biography,
            command.SpecializationSummary,
            command.KepAddress,
            command.CvDocumentId);

    private static int Calculate(
        string? academicTitle,
        string? degreeLevel,
        string? institutionName,
        string? facultyName,
        string? departmentName,
        string? positionTitle,
        string? biography,
        string? specializationSummary,
        string? kepAddress,
        Guid? cvDocumentId)
    {
        var completed = 0;
        const int total = 11;

        completed += IsFilled(academicTitle);
        completed += IsFilled(degreeLevel);
        completed += IsFilled(institutionName);
        completed += IsFilled(facultyName);
        completed += IsFilled(departmentName);
        completed += IsFilled(positionTitle);
        completed += IsFilled(biography);
        completed += IsFilled(specializationSummary);
        completed += 1;
        completed += IsFilled(kepAddress);
        completed += cvDocumentId.HasValue ? 1 : 0;

        return (int)Math.Round(completed * 100d / total, MidpointRounding.AwayFromZero);
    }

    private static int IsFilled(string? value) => string.IsNullOrWhiteSpace(value) ? 0 : 1;
}
