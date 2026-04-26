import type {
  ApplicationDocumentResponse,
  ApplicationEntryMode,
  ApplicationExpertAssignmentResponse,
  ApplicationExpertReviewDecisionResponse,
  ApplicationFormResponse,
  ApplicationCommitteeAgendaItemResponse,
  ApplicationRevisionResponseResponse,
  ApplicationReviewPackageResponse,
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
  ApplicationAccessProbeResponse,
  CommitteeLookupResponse,
  DevelopmentRoleAssignmentResponse,
  ConfirmContactCodeResponse,
  ContactChannelType,
  CurrentUserResponse,
  CurrentProfileResponse,
  CreateProfileResponse,
  LoginResponse,
  MockMessageResponse,
  ProblemDetailsLike,
  ProfileForm,
  RegisterForm,
  RegisterResponse,
  RoutingAssessmentResponse,
  SendContactCodeResponse,
  VerifyIdentityResponse,
} from "./types";

const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? "/api";

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isApiErrorStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ProblemDetailsLike | T)
    : undefined;

  if (!response.ok) {
    const problem = payload as ProblemDetailsLike | undefined;
    throw new ApiError(
      problem?.detail ?? problem?.title ?? "Beklenmeyen bir hata olustu.",
      response.status,
    );
  }

  return payload as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Beklenmeyen bir hata olustu.";
}

export function registerUser(payload: RegisterForm) {
  return request<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyIdentity(userId: string) {
  return request<VerifyIdentityResponse>("/auth/verify-identity", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function sendCode(userId: string, channelType: ContactChannelType) {
  return request<SendContactCodeResponse>("/auth/send-code", {
    method: "POST",
    body: JSON.stringify({ userId, channelType }),
  });
}

export function confirmCode(userId: string, channelType: ContactChannelType, code: string) {
  return request<ConfirmContactCodeResponse>("/auth/confirm-code", {
    method: "POST",
    body: JSON.stringify({ userId, channelType, code }),
  });
}

export function createProfile(accessToken: string, payload: ProfileForm) {
  return request<CreateProfileResponse>("/profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      academicTitle: payload.academicTitle || null,
      degreeLevel: payload.degreeLevel || null,
      institutionName: payload.institutionName || null,
      facultyName: payload.facultyName || null,
      departmentName: payload.departmentName || null,
      positionTitle: payload.positionTitle || null,
      biography: payload.biography || null,
      specializationSummary: payload.specializationSummary || null,
      hasESignature: payload.hasESignature,
      kepAddress: payload.kepAddress || null,
      cvDocumentId: payload.cvDocumentId || null,
    }),
  });
}

export function updateProfile(accessToken: string, payload: ProfileForm) {
  return request<CurrentProfileResponse>("/profile/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      academicTitle: payload.academicTitle || null,
      degreeLevel: payload.degreeLevel || null,
      institutionName: payload.institutionName || null,
      facultyName: payload.facultyName || null,
      departmentName: payload.departmentName || null,
      positionTitle: payload.positionTitle || null,
      biography: payload.biography || null,
      specializationSummary: payload.specializationSummary || null,
      hasESignature: payload.hasESignature,
      kepAddress: payload.kepAddress || null,
      cvDocumentId: payload.cvDocumentId || null,
    }),
  });
}

export function fetchMockMessages(email: string, phone: string) {
  const params = new URLSearchParams();
  if (email) {
    params.set("email", email);
  }

  if (phone) {
    params.set("phone", phone);
  }

  return request<MockMessageResponse[]>(`/dev/mock-messages?${params.toString()}`);
}

export function loginUser(emailOrPhone: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ emailOrPhone, password }),
  });
}

export function fetchCurrentUser(accessToken: string) {
  return request<CurrentUserResponse>(
    "/auth/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function fetchCurrentProfile(accessToken: string) {
  return request<CurrentProfileResponse>(
    "/profile/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function probeApplicationAccess(accessToken: string) {
  return request<ApplicationAccessProbeResponse>(
    "/auth/application-access/probe",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function fetchCommittees(accessToken: string) {
  return request<CommitteeLookupResponse[]>(
    "/committees",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function createApplication(accessToken: string, title: string, summary: string) {
  return request<ApplicationSummaryResponse>(
    "/applications",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title,
        summary,
      }),
    },
  );
}

export function fetchMyApplications(accessToken: string) {
  return request<ApplicationSummaryResponse[]>(
    "/applications",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function fetchApplication(accessToken: string, applicationId: string) {
  return request<ApplicationSummaryResponse>(
    `/applications/${applicationId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function setApplicationEntryMode(
  accessToken: string,
  applicationId: string,
  entryMode: ApplicationEntryMode,
) {
  return request<ApplicationSummaryResponse>(
    `/applications/${applicationId}/entry-mode`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        entryMode,
      }),
    },
  );
}

export function saveApplicationIntake(
  accessToken: string,
  applicationId: string,
  payload: {
    answers: Record<string, unknown>;
    suggestedCommitteeId: string;
    alternativeCommittees: string[];
    confidenceScore: number;
    explanationText: string;
  },
) {
  return request<RoutingAssessmentResponse>(
    `/applications/${applicationId}/intake`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );
}

export function selectApplicationCommittee(
  accessToken: string,
  applicationId: string,
  committeeId: string,
  committeeSelectionSource: string,
) {
  return request<ApplicationSummaryResponse>(
    `/applications/${applicationId}/committee`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        committeeId,
        committeeSelectionSource,
      }),
    },
  );
}

export function saveApplicationForm(
  accessToken: string,
  applicationId: string,
  formCode: string,
  payload: {
    versionNo: number;
    data: Record<string, unknown>;
    completionPercent: number;
  },
) {
  return request<ApplicationFormResponse>(
    `/applications/${applicationId}/forms/${formCode}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );
}

export function addApplicationDocument(
  accessToken: string,
  applicationId: string,
  payload: {
    documentType: string;
    sourceType: string;
    originalFileName: string;
    storageKey: string;
    mimeType: string;
    versionNo: number;
    isRequired: boolean;
  },
) {
  return request<ApplicationDocumentResponse>(
    `/applications/${applicationId}/documents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );
}

export function validateApplication(accessToken: string, applicationId: string) {
  return request<ApplicationValidationResponse>(
    `/applications/${applicationId}/validate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    },
  );
}

export function submitApplication(accessToken: string, applicationId: string) {
  return request<ApplicationSummaryResponse>(
    `/applications/${applicationId}/submit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    },
  );
}

export function assignDevelopmentRole(userId: string, roleCode: string) {
  return request<DevelopmentRoleAssignmentResponse>("/dev/roles/assign", {
    method: "POST",
    body: JSON.stringify({ userId, roleCode }),
  });
}

export function fetchExpertAssignmentQueue(accessToken: string) {
  return request<ApplicationSummaryResponse[]>(
    "/applications/expert-assignment/queue",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function assignApplicationExpert(accessToken: string, applicationId: string, expertUserId: string) {
  return request<ApplicationExpertAssignmentResponse>(
    `/applications/${applicationId}/expert-assignment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        expertUserId,
      }),
    },
  );
}

export function fetchMyExpertAssignments(accessToken: string) {
  return request<ApplicationExpertAssignmentResponse[]>(
    "/applications/expert-review/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function startExpertReview(accessToken: string, applicationId: string) {
  return request<ApplicationExpertAssignmentResponse>(
    `/applications/${applicationId}/expert-review/start`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    },
  );
}

export function requestExpertRevision(accessToken: string, applicationId: string, note: string) {
  return request<ApplicationExpertReviewDecisionResponse>(
    `/applications/${applicationId}/expert-review/request-revision`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        note,
      }),
    },
  );
}

export function approveExpertReview(accessToken: string, applicationId: string, note: string) {
  return request<ApplicationExpertReviewDecisionResponse>(
    `/applications/${applicationId}/expert-review/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        note,
      }),
    },
  );
}

export function submitApplicationRevisionResponse(accessToken: string, applicationId: string, responseNote: string) {
  return request<ApplicationRevisionResponseResponse>(
    `/applications/${applicationId}/revision-response`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        responseNote,
      }),
    },
  );
}

export function fetchApplicationPackageQueue(accessToken: string) {
  return request<ApplicationSummaryResponse[]>(
    "/applications/secretariat/package-queue",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function prepareApplicationPackage(accessToken: string, applicationId: string, note: string) {
  return request<ApplicationReviewPackageResponse>(
    `/applications/${applicationId}/secretariat/package`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        note,
      }),
    },
  );
}

export function fetchCommitteeAgendaQueue(accessToken: string) {
  return request<ApplicationSummaryResponse[]>(
    "/applications/committee-agenda/queue",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export function addApplicationToCommitteeAgenda(accessToken: string, applicationId: string, note: string) {
  return request<ApplicationCommitteeAgendaItemResponse>(
    `/applications/${applicationId}/committee-agenda`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        note,
      }),
    },
  );
}
