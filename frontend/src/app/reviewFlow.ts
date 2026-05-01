import type { ApplicationCurrentStep } from "../types";

export const reviewFlowSteps: readonly ApplicationCurrentStep[] = [
  "WaitingExpertAssignment",
  "ExpertAssigned",
  "UnderExpertReview",
  "ExpertRevisionRequested",
  "ExpertApproved",
  "PackageReady",
  "UnderCommitteeReview",
  "CommitteeRevisionRequested",
];

export function isReviewFlowStep(step: ApplicationCurrentStep | null | undefined) {
  return step ? reviewFlowSteps.includes(step) : false;
}

export function isReviewCompletedStep(step: ApplicationCurrentStep | null | undefined) {
  return step === "Approved";
}
