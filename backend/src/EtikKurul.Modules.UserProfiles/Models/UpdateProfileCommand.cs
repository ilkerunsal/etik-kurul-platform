namespace EtikKurul.Modules.UserProfiles.Models;

public sealed record UpdateProfileCommand(
    Guid UserId,
    string? AcademicTitle,
    string? DegreeLevel,
    string? InstitutionName,
    string? FacultyName,
    string? DepartmentName,
    string? PositionTitle,
    string? Biography,
    string? SpecializationSummary,
    bool HasESignature,
    string? KepAddress,
    Guid? CvDocumentId);
