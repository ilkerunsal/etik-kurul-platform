using EtikKurul.Infrastructure.Enums;
using EtikKurul.Modules.Applications.Models;
using EtikKurul.Modules.Applications.Services;

namespace EtikKurul.UnitTests.Modules;

public class ApplicationValidationBaseEvaluatorTests
{
    private readonly ApplicationValidationBaseEvaluator _evaluator = new();

    [Fact]
    public void Evaluate_ReturnsBlockedDecision_WhenCorePrerequisitesAreMissing()
    {
        var snapshot = new ApplicationValidationSnapshot(
            IsProfileReady: false,
            HasEntryMode: false,
            HasRoutingAssessment: false,
            HasCommittee: false,
            HasForms: false,
            AreFormsComplete: false,
            HasRejectedRequiredDocuments: false);

        var result = _evaluator.Evaluate(snapshot);

        Assert.False(result.IsValid);
        Assert.Contains(result.Templates, x => x.ItemCode == "profile_ready" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(result.Templates, x => x.ItemCode == "entry_mode_selected" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(result.Templates, x => x.ItemCode == "intake_completed" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(result.Templates, x => x.ItemCode == "committee_selected" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(result.Templates, x => x.ItemCode == "forms_present" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.DoesNotContain(result.Templates, x => x.ItemCode == "forms_complete");
    }

    [Fact]
    public void Evaluate_ReturnsBlockedDecision_WhenFormsOrRequiredDocumentsFail()
    {
        var snapshot = new ApplicationValidationSnapshot(
            IsProfileReady: true,
            HasEntryMode: true,
            HasRoutingAssessment: true,
            HasCommittee: true,
            HasForms: true,
            AreFormsComplete: false,
            HasRejectedRequiredDocuments: true);

        var result = _evaluator.Evaluate(snapshot);

        Assert.False(result.IsValid);
        Assert.Contains(result.Templates, x => x.ItemCode == "forms_complete" && x.Status == ApplicationChecklistStatus.Blocked);
        Assert.Contains(result.Templates, x => x.ItemCode == "required_documents_status" && x.Status == ApplicationChecklistStatus.Blocked);
    }

    [Fact]
    public void Evaluate_ReturnsValidDecision_WhenValidationBaseIsSatisfied()
    {
        var snapshot = new ApplicationValidationSnapshot(
            IsProfileReady: true,
            HasEntryMode: true,
            HasRoutingAssessment: true,
            HasCommittee: true,
            HasForms: true,
            AreFormsComplete: true,
            HasRejectedRequiredDocuments: false);

        var result = _evaluator.Evaluate(snapshot);

        Assert.True(result.IsValid);
        Assert.All(result.Templates, x => Assert.Equal(ApplicationChecklistStatus.Passed, x.Status));
    }
}
