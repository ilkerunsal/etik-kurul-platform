import { request } from "./client";
import type {
  DevelopmentRoleAssignmentResponse,
  MockMessageResponse,
} from "../types";

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

export function assignDevelopmentRole(userId: string, roleCode: string) {
  return request<DevelopmentRoleAssignmentResponse>("/dev/roles/assign", {
    method: "POST",
    body: JSON.stringify({ userId, roleCode }),
  });
}
