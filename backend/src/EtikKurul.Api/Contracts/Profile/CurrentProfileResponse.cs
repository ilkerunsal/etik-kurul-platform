namespace EtikKurul.Api.Contracts.Profile;

public sealed record CurrentProfileResponse(
    Guid ProfileId,
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
    Guid? CvDocumentId,
    int ProfileCompletionPercent);
