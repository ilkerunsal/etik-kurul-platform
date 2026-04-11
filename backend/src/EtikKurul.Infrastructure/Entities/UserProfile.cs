namespace EtikKurul.Infrastructure.Entities;

public class UserProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? AcademicTitle { get; set; }
    public string? DegreeLevel { get; set; }
    public string? InstitutionName { get; set; }
    public string? FacultyName { get; set; }
    public string? DepartmentName { get; set; }
    public string? PositionTitle { get; set; }
    public string? Biography { get; set; }
    public string? SpecializationSummary { get; set; }
    public bool HasESignature { get; set; }
    public string? KepAddress { get; set; }
    public Guid? CvDocumentId { get; set; }
    public int ProfileCompletionPercent { get; set; }
    public User User { get; set; } = null!;
}
