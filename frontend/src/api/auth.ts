import { request } from "./client";
import type {
  ApplicationAccessProbeResponse,
  ConfirmContactCodeResponse,
  ContactChannelType,
  CurrentUserResponse,
  LoginResponse,
  RegisterForm,
  RegisterResponse,
  SendContactCodeResponse,
  VerifyIdentityResponse,
} from "../types";

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
