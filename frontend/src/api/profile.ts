import { request } from "./client";
import type {
  CreateProfileResponse,
  CurrentProfileResponse,
  ProfileForm,
} from "../types";

function serializeProfileForm(payload: ProfileForm) {
  return {
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
  };
}

export function createProfile(accessToken: string, payload: ProfileForm) {
  return request<CreateProfileResponse>("/profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(serializeProfileForm(payload)),
  });
}

export function updateProfile(accessToken: string, payload: ProfileForm) {
  return request<CurrentProfileResponse>("/profile/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(serializeProfileForm(payload)),
  });
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
