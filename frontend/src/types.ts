export type AccountStatus =
  | "pending_identity_check"
  | "identity_failed"
  | "contact_pending"
  | "active"
  | "suspended"
  | "archived";

export type ContactChannelType = "email" | "sms";

export interface RegisterForm {
  firstName: string;
  lastName: string;
  tckn: string;
  birthDate: string;
  email: string;
  phone: string;
  password: string;
}

export interface ProfileForm {
  academicTitle: string;
  degreeLevel: string;
  institutionName: string;
  facultyName: string;
  departmentName: string;
  positionTitle: string;
  biography: string;
  specializationSummary: string;
  hasESignature: boolean;
  kepAddress: string;
  cvDocumentId: string;
}

export interface RegisterResponse {
  userId: string;
  accountStatus: AccountStatus;
}

export interface VerifyIdentityResponse {
  userId: string;
  success: boolean;
  responseCode: string;
  accountStatus: AccountStatus;
}

export interface SendContactCodeResponse {
  userId: string;
  channelType: ContactChannelType;
  expiresAt: string;
  accountStatus: AccountStatus;
}

export interface ConfirmContactCodeResponse {
  userId: string;
  channelType: ContactChannelType;
  channelVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountStatus: AccountStatus;
}

export interface CreateProfileResponse {
  profileId: string;
  userId: string;
  profileCompletionPercent: number;
}

export interface CurrentProfileResponse {
  profileId: string;
  userId: string;
  academicTitle: string | null;
  degreeLevel: string | null;
  institutionName: string | null;
  facultyName: string | null;
  departmentName: string | null;
  positionTitle: string | null;
  biography: string | null;
  specializationSummary: string | null;
  hasESignature: boolean;
  kepAddress: string | null;
  cvDocumentId: string | null;
  profileCompletionPercent: number;
}

export interface ApplicationAccessResponse {
  canOpenApplication: boolean;
  reasonCode: string;
  currentProfileCompletionPercent: number | null;
  minimumProfileCompletionPercent: number | null;
}

export interface SessionUserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountStatus: AccountStatus;
  isIdentityVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompletionPercent: number | null;
  roles: string[];
  applicationAccess: ApplicationAccessResponse;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: SessionUserResponse;
}

export interface CurrentUserResponse {
  user: SessionUserResponse;
}

export interface CurrentApplicationAccessResponse {
  access: ApplicationAccessResponse;
}

export interface ApplicationAccessProbeResponse {
  status: string;
}

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "UnderReview"
  | "AdditionalDocumentsRequested"
  | "Approved"
  | "Rejected"
  | "Suspended"
  | "Withdrawn"
  | "Closed";

export type ApplicationCurrentStep =
  | "Draft"
  | "ProfileIncomplete"
  | "IntakeInProgress"
  | "CommitteeSelected"
  | "ApplicationInPreparation"
  | "ValidationFailed"
  | "ValidationPassed"
  | "WaitingExpertAssignment"
  | "ExpertAssigned"
  | "UnderExpertReview"
  | "ExpertRevisionRequested"
  | "ExpertApproved"
  | "PackageReady"
  | "ExternalSubmissionPending"
  | "ExternallySubmitted"
  | "UnderCommitteeReview"
  | "CommitteeRevisionRequested"
  | "Approved"
  | "Rejected"
  | "Withdrawn"
  | "Closed";

export type ApplicationEntryMode = "Direct" | "Guided";

export type ApplicationExpertReviewDecisionType = "RevisionRequested" | "Approved";

export type ApplicationCommitteeDecisionType = "RevisionRequested" | "Approved" | "Rejected";

export interface ApplicationSummaryResponse {
  applicationId: string;
  publicRefNo: string | null;
  status: ApplicationStatus;
  currentStep: ApplicationCurrentStep;
  entryMode: ApplicationEntryMode | null;
  committeeId: string | null;
  committeeSelectionSource: string | null;
  routingConfidence: number | null;
  submittedAt: string | null;
  title: string | null;
  summary: string | null;
}

export type ApplicationFinalDossierStatus =
  | "not_ready"
  | "package_pending"
  | "package_ready"
  | "agenda_ready"
  | "final_ready";

export interface ApplicationFinalDossierResponse {
  applicationId: string;
  isReady: boolean;
  dossierStatus: ApplicationFinalDossierStatus;
  generatedAt: string;
  finalDossierDocumentId: string | null;
  finalDossierVersionNo: number | null;
  finalDossierSha256Hash: string | null;
  finalDossierGeneratedAt: string | null;
  finalDossierFileName: string | null;
  application: ApplicationSummaryResponse;
  reviewPackageId: string | null;
  reviewPackagePreparedAt: string | null;
  reviewPackageNote: string | null;
  agendaItemId: string | null;
  agendaAddedAt: string | null;
  committeeId: string | null;
  agendaNote: string | null;
  committeeDecisionId: string | null;
  committeeDecisionType: ApplicationCommitteeDecisionType | null;
  committeeDecisionAt: string | null;
  committeeDecisionNote: string | null;
  formCount: number;
  documentCount: number;
  checklistItemCount: number;
  expertDecisionCount: number;
  applicantRevisionResponseCount: number;
  committeeRevisionResponseCount: number;
  includedSections: string[];
}

export interface CommitteeLookupResponse {
  committeeId: string;
  code: string;
  name: string;
  category: string | null;
}

export interface RoutingAssessmentResponse {
  routingAssessmentId: string;
  applicationId: string;
  suggestedCommitteeId: string | null;
  confidenceScore: number | null;
  explanationText: string | null;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface ApplicationFormResponse {
  formId: string;
  applicationId: string;
  formCode: string;
  versionNo: number;
  completionPercent: number;
  isLocked: boolean;
  application: ApplicationSummaryResponse;
}

export interface ApplicationDocumentResponse {
  documentId: string;
  applicationId: string;
  documentType: string;
  sourceType: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  versionNo: number;
  isRequired: boolean;
  validationStatus: string;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface ApplicationChecklistItemResponse {
  checklistItemId: string;
  itemCode: string;
  label: string;
  severity: string;
  status: string;
  message: string;
  autoGenerated: boolean;
  resolvedAt: string | null;
}

export interface ApplicationValidationResponse {
  applicationId: string;
  status: ApplicationStatus;
  currentStep: ApplicationCurrentStep;
  isValid: boolean;
  items: ApplicationChecklistItemResponse[];
}

export interface ApplicationExpertAssignmentResponse {
  assignmentId: string;
  applicationId: string;
  expertUserId: string;
  expertDisplayName: string;
  assignedByUserId: string;
  assignedByDisplayName: string;
  active: boolean;
  assignedAt: string;
  reviewStartedAt: string | null;
  application: ApplicationSummaryResponse;
}

export interface ApplicationExpertReviewDecisionResponse {
  decisionId: string;
  assignmentId: string;
  applicationId: string;
  expertUserId: string;
  decisionType: ApplicationExpertReviewDecisionType;
  note: string | null;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface ApplicationRevisionResponseResponse {
  revisionResponseId: string;
  applicationId: string;
  expertReviewDecisionId: string;
  submittedByUserId: string;
  responseNote: string;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface ApplicationReviewPackageResponse {
  reviewPackageId: string;
  applicationId: string;
  preparedByUserId: string;
  note: string | null;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface ApplicationCommitteeAgendaItemResponse {
  agendaItemId: string;
  applicationId: string;
  committeeId: string;
  reviewPackageId: string;
  addedByUserId: string;
  note: string | null;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface ApplicationCommitteeDecisionResponse {
  decisionId: string;
  agendaItemId: string;
  applicationId: string;
  decidedByUserId: string;
  decisionType: ApplicationCommitteeDecisionType;
  note: string | null;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface ApplicationCommitteeRevisionResponseResponse {
  revisionResponseId: string;
  applicationId: string;
  committeeDecisionId: string;
  submittedByUserId: string;
  responseNote: string;
  createdAt: string;
  application: ApplicationSummaryResponse;
}

export interface DevelopmentRoleAssignmentResponse {
  userId: string;
  roleId: string;
  roleCode: string;
  active: boolean;
  assignedAt: string;
}

export interface MockMessageResponse {
  id: string;
  channelType: ContactChannelType;
  recipient: string;
  subject: string | null;
  body: string;
  code: string | null;
  sentAt: string;
}

export interface ProblemDetailsLike {
  title?: string;
  detail?: string;
  status?: number;
}

export interface ActivityEntry {
  id: string;
  tone: "neutral" | "success" | "error";
  message: string;
  timestamp: string;
}
