using EtikKurul.Infrastructure.Enums;
using EtikKurul.Modules.Applications.Models;

namespace EtikKurul.Modules.Applications.Services;

public class ApplicationValidationBaseEvaluator
{
    public ApplicationValidationDecision Evaluate(ApplicationValidationSnapshot snapshot)
    {
        var templates = new List<ApplicationChecklistTemplate>
        {
            BuildHardBlock(
                "profile_ready",
                "Profile readiness",
                snapshot.IsProfileReady,
                "Application prerequisites are satisfied at the profile level.",
                "Application access prerequisites are not satisfied for this user."),
            BuildHardBlock(
                "entry_mode_selected",
                "Entry mode selection",
                snapshot.HasEntryMode,
                "Application entry mode is selected.",
                "Application entry mode must be selected before validation."),
            BuildHardBlock(
                "intake_completed",
                "Intake completion",
                snapshot.HasRoutingAssessment,
                "Intake answers are recorded.",
                "Intake answers must be recorded before validation."),
            BuildHardBlock(
                "committee_selected",
                "Committee selection",
                snapshot.HasCommittee,
                "Committee selection is recorded.",
                "A committee must be selected before validation."),
            BuildHardBlock(
                "forms_present",
                "Application forms",
                snapshot.HasForms,
                "At least one application form is recorded.",
                "At least one application form must be recorded before validation."),
        };

        if (snapshot.HasForms)
        {
            templates.Add(BuildHardBlock(
                "forms_complete",
                "Form completion",
                snapshot.AreFormsComplete,
                "All recorded forms are marked as complete.",
                "All recorded forms must have a completion percent of 100."));
        }

        templates.Add(snapshot.HasRejectedRequiredDocuments
            ? new ApplicationChecklistTemplate(
                "required_documents_status",
                "Required document status",
                ApplicationChecklistSeverity.HardBlock,
                ApplicationChecklistStatus.Blocked,
                "At least one required document is marked as invalid.")
            : new ApplicationChecklistTemplate(
                "required_documents_status",
                "Required document status",
                ApplicationChecklistSeverity.Info,
                ApplicationChecklistStatus.Passed,
                "No invalid required document metadata was detected."));

        var isValid = templates.All(x => x.Status != ApplicationChecklistStatus.Blocked);
        return new ApplicationValidationDecision(isValid, templates);
    }

    private static ApplicationChecklistTemplate BuildHardBlock(
        string itemCode,
        string label,
        bool passed,
        string passedMessage,
        string blockedMessage)
        => new(
            itemCode,
            label,
            ApplicationChecklistSeverity.HardBlock,
            passed ? ApplicationChecklistStatus.Passed : ApplicationChecklistStatus.Blocked,
            passed ? passedMessage : blockedMessage);
}
