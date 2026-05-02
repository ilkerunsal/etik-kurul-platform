import { request, requestText } from "./client";
import type {
  ApplicationCommitteeAgendaItemResponse,
  ApplicationCommitteeDecisionResponse,
  ApplicationCommitteeRevisionResponseResponse,
  ApplicationDocumentResponse,
  ApplicationEntryMode,
  ApplicationExpertAssignmentResponse,
  ApplicationExpertReviewDecisionResponse,
  ApplicationFinalDossierResponse,
  ApplicationFormResponse,
  ApplicationRevisionResponseResponse,
  ApplicationReviewPackageResponse,
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
  CommitteeLookupResponse,
  RoutingAssessmentResponse,
} from "../types";

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

export function fetchApplicationFinalDossier(accessToken: string, applicationId: string) {
  return request<ApplicationFinalDossierResponse>(
    `/applications/${applicationId}/final-dossier`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function fetchApplicationFinalDossierDocument(accessToken: string, applicationId: string) {
  const result = await requestText(
    `/applications/${applicationId}/final-dossier/document`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return {
    html: result.text,
    contentType: result.contentType,
    fileName: result.fileName ?? `etik-kurul-karar-dosyasi-${applicationId}.html`,
  };
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

export function requestCommitteeRevision(accessToken: string, applicationId: string, note: string) {
  return request<ApplicationCommitteeDecisionResponse>(
    `/applications/${applicationId}/committee-review/request-revision`,
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

export function submitCommitteeRevisionResponse(accessToken: string, applicationId: string, responseNote: string) {
  return request<ApplicationCommitteeRevisionResponseResponse>(
    `/applications/${applicationId}/committee-revision-response`,
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

export function approveCommitteeReview(accessToken: string, applicationId: string, note: string) {
  return request<ApplicationCommitteeDecisionResponse>(
    `/applications/${applicationId}/committee-review/approve`,
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

export function rejectCommitteeReview(accessToken: string, applicationId: string, note: string) {
  return request<ApplicationCommitteeDecisionResponse>(
    `/applications/${applicationId}/committee-review/reject`,
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
