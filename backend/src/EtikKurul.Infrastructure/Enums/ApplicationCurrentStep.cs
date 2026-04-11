namespace EtikKurul.Infrastructure.Enums;

public enum ApplicationCurrentStep
{
    Draft = 0,
    ProfileIncomplete = 1,
    IntakeInProgress = 2,
    CommitteeSelected = 3,
    ApplicationInPreparation = 4,
    ValidationFailed = 5,
    ValidationPassed = 6,
    WaitingExpertAssignment = 7,
    ExpertAssigned = 8,
    UnderExpertReview = 9,
    ExpertRevisionRequested = 10,
    ExpertApproved = 11,
    PackageReady = 12,
    ExternalSubmissionPending = 13,
    ExternallySubmitted = 14,
    UnderCommitteeReview = 15,
    CommitteeRevisionRequested = 16,
    Approved = 17,
    Rejected = 18,
    Withdrawn = 19,
    Closed = 20,
}
