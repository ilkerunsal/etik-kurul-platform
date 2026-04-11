using System.ComponentModel.DataAnnotations;

namespace EtikKurul.Api.Contracts.Profile;

public class CreateProfileRequest
{
    [MaxLength(128)]
    public string? AcademicTitle { get; set; }

    [MaxLength(128)]
    public string? DegreeLevel { get; set; }

    [MaxLength(256)]
    public string? InstitutionName { get; set; }

    [MaxLength(256)]
    public string? FacultyName { get; set; }

    [MaxLength(256)]
    public string? DepartmentName { get; set; }

    [MaxLength(256)]
    public string? PositionTitle { get; set; }

    public string? Biography { get; set; }

    public string? SpecializationSummary { get; set; }

    public bool HasESignature { get; set; }

    [MaxLength(320)]
    public string? KepAddress { get; set; }

    public Guid? CvDocumentId { get; set; }
}
