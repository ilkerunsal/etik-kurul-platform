import type {
  AccountStatus,
  ActivityEntry,
  ContactChannelType,
  ApplicationFinalDossierResponse,
  MockMessageResponse,
  ProfileForm,
  RegisterForm,
  SessionUserResponse,
} from "../types";

export const STORAGE_KEY = "etik-kurul-phase1-ui:v5";

export const emptyRegisterForm: RegisterForm = {
  firstName: "",
  lastName: "",
  tckn: "",
  birthDate: "",
  email: "",
  phone: "",
  password: "",
};

export const emptyProfileForm: ProfileForm = {
  academicTitle: "",
  degreeLevel: "",
  institutionName: "",
  facultyName: "",
  departmentName: "",
  positionTitle: "",
  biography: "",
  specializationSummary: "",
  hasESignature: false,
  kepAddress: "",
  cvDocumentId: "",
};

export const emptyCodes: Record<ContactChannelType, string> = { email: "", sms: "" };

export type BusyAction =
  | "register"
  | "verify-identity"
  | "refresh-messages"
  | "send-email"
  | "send-sms"
  | "confirm-email"
  | "confirm-sms"
  | "create-profile"
  | "update-profile"
  | "login"
  | "fetch-session"
  | "fetch-applications"
  | "probe-application"
  | "create-application"
  | "prepare-application"
  | "select-application"
  | "provision-review-roles"
  | "review-operation"
  | "fetch-final-dossier";

export interface BannerState {
  tone: "success" | "error" | "neutral";
  title: string;
  detail: string;
}

export interface SnapshotState {
  registerForm: RegisterForm;
  profileForm: ProfileForm;
  codes: Record<ContactChannelType, string>;
  userId: string;
  currentProfileId: string | null;
  accountStatus: AccountStatus | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompletionPercent: number | null;
  identityResponseCode: string | null;
  mockMessages: MockMessageResponse[];
  activity: ActivityEntry[];
  banner: BannerState | null;
  loginIdentifier: string;
  loginPassword: string;
  sessionToken: string;
  sessionExpiresAt: string | null;
  currentUser: SessionUserResponse | null;
  applicationProbeStatus: number | null;
  applicationProbeState: string | null;
  applicationCreateStatus: number | null;
  applicationCreateState: string | null;
  applicationSubmitStatus: number | null;
  applicationSubmitState: string | null;
  expertQueueCount: number | null;
  expertAssignmentStatus: number | null;
  expertAssignmentState: string | null;
  expertReviewStatus: number | null;
  expertReviewState: string | null;
  revisionResponseStatus: number | null;
  revisionResponseState: string | null;
  expertDecisionStatus: number | null;
  expertDecisionState: string | null;
  packageQueueCount: number | null;
  packageStatus: number | null;
  packageState: string | null;
  agendaQueueCount: number | null;
  agendaStatus: number | null;
  agendaState: string | null;
  committeeRevisionStatus: number | null;
  committeeRevisionState: string | null;
  committeeRevisionResponseStatus: number | null;
  committeeRevisionResponseState: string | null;
  committeeDecisionStatus: number | null;
  committeeDecisionState: string | null;
  finalDossier: ApplicationFinalDossierResponse | null;
}

export function createDefaultSnapshot(): SnapshotState {
  return {
    registerForm: emptyRegisterForm,
    profileForm: emptyProfileForm,
    codes: emptyCodes,
    userId: "",
    currentProfileId: null,
    accountStatus: null,
    emailVerified: false,
    phoneVerified: false,
    profileCompletionPercent: null,
    identityResponseCode: null,
    mockMessages: [],
    activity: [],
    banner: null,
    loginIdentifier: "",
    loginPassword: "",
    sessionToken: "",
    sessionExpiresAt: null,
    currentUser: null,
    applicationProbeStatus: null,
    applicationProbeState: null,
    applicationCreateStatus: null,
    applicationCreateState: null,
    applicationSubmitStatus: null,
    applicationSubmitState: null,
    expertQueueCount: null,
    expertAssignmentStatus: null,
    expertAssignmentState: null,
    expertReviewStatus: null,
    expertReviewState: null,
    revisionResponseStatus: null,
    revisionResponseState: null,
    expertDecisionStatus: null,
    expertDecisionState: null,
    packageQueueCount: null,
    packageStatus: null,
    packageState: null,
    agendaQueueCount: null,
    agendaStatus: null,
    agendaState: null,
    committeeRevisionStatus: null,
    committeeRevisionState: null,
    committeeRevisionResponseStatus: null,
    committeeRevisionResponseState: null,
    committeeDecisionStatus: null,
    committeeDecisionState: null,
    finalDossier: null,
  };
}

function normalizeCurrentUser(value: Partial<SessionUserResponse> | null | undefined): SessionUserResponse | null {
  if (!value || !value.applicationAccess) {
    return null;
  }

  return value as SessionUserResponse;
}

export function loadSnapshot(): SnapshotState {
  if (typeof window === "undefined") {
    return createDefaultSnapshot();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultSnapshot();
    }

    const parsed = JSON.parse(raw) as Partial<SnapshotState>;
    return {
      registerForm: { ...emptyRegisterForm, ...parsed.registerForm },
      profileForm: { ...emptyProfileForm, ...parsed.profileForm },
      codes: { ...emptyCodes, ...parsed.codes },
      userId: parsed.userId ?? "",
      currentProfileId: parsed.currentProfileId ?? null,
      accountStatus: parsed.accountStatus ?? null,
      emailVerified: parsed.emailVerified ?? false,
      phoneVerified: parsed.phoneVerified ?? false,
      profileCompletionPercent: parsed.profileCompletionPercent ?? null,
      identityResponseCode: parsed.identityResponseCode ?? null,
      mockMessages: parsed.mockMessages ?? [],
      activity: parsed.activity ?? [],
      banner: parsed.banner ?? null,
      loginIdentifier: parsed.loginIdentifier ?? "",
      loginPassword: parsed.loginPassword ?? "",
      sessionToken: parsed.sessionToken ?? "",
      sessionExpiresAt: parsed.sessionExpiresAt ?? null,
      currentUser: normalizeCurrentUser(parsed.currentUser as Partial<SessionUserResponse> | null | undefined),
      applicationProbeStatus: parsed.applicationProbeStatus ?? null,
      applicationProbeState: parsed.applicationProbeState ?? null,
      applicationCreateStatus: parsed.applicationCreateStatus ?? null,
      applicationCreateState: parsed.applicationCreateState ?? null,
      applicationSubmitStatus: parsed.applicationSubmitStatus ?? null,
      applicationSubmitState: parsed.applicationSubmitState ?? null,
      expertQueueCount: parsed.expertQueueCount ?? null,
      expertAssignmentStatus: parsed.expertAssignmentStatus ?? null,
      expertAssignmentState: parsed.expertAssignmentState ?? null,
      expertReviewStatus: parsed.expertReviewStatus ?? null,
      expertReviewState: parsed.expertReviewState ?? null,
      revisionResponseStatus: parsed.revisionResponseStatus ?? null,
      revisionResponseState: parsed.revisionResponseState ?? null,
      expertDecisionStatus: parsed.expertDecisionStatus ?? null,
      expertDecisionState: parsed.expertDecisionState ?? null,
      packageQueueCount: parsed.packageQueueCount ?? null,
      packageStatus: parsed.packageStatus ?? null,
      packageState: parsed.packageState ?? null,
      agendaQueueCount: parsed.agendaQueueCount ?? null,
      agendaStatus: parsed.agendaStatus ?? null,
      agendaState: parsed.agendaState ?? null,
      committeeRevisionStatus: parsed.committeeRevisionStatus ?? null,
      committeeRevisionState: parsed.committeeRevisionState ?? null,
      committeeRevisionResponseStatus: parsed.committeeRevisionResponseStatus ?? null,
      committeeRevisionResponseState: parsed.committeeRevisionResponseState ?? null,
      committeeDecisionStatus: parsed.committeeDecisionStatus ?? null,
      committeeDecisionState: parsed.committeeDecisionState ?? null,
      finalDossier: parsed.finalDossier ?? null,
    };
  } catch {
    return createDefaultSnapshot();
  }
}
