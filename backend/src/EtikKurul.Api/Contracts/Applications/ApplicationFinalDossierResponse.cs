using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationFinalDossierResponse(
    Guid ApplicationId,
    bool IsReady,
    string DossierStatus,
    DateTimeOffset GeneratedAt,
    Guid? FinalDossierDocumentId,
    int? FinalDossierVersionNo,
    string? FinalDossierSha256Hash,
    DateTimeOffset? FinalDossierGeneratedAt,
    string? FinalDossierFileName,
    ApplicationSummaryResponse Application,
    Guid? ReviewPackageId,
    DateTimeOffset? ReviewPackagePreparedAt,
    string? ReviewPackageNote,
    Guid? AgendaItemId,
    DateTimeOffset? AgendaAddedAt,
    Guid? CommitteeId,
    string? AgendaNote,
    Guid? CommitteeDecisionId,
    ApplicationCommitteeDecisionType? CommitteeDecisionType,
    DateTimeOffset? CommitteeDecisionAt,
    string? CommitteeDecisionNote,
    int FormCount,
    int DocumentCount,
    int ChecklistItemCount,
    int ExpertDecisionCount,
    int ApplicantRevisionResponseCount,
    int CommitteeRevisionResponseCount,
    IReadOnlyList<string> IncludedSections);
