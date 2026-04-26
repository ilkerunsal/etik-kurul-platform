import type { SnapshotState } from "./demoState";

export type WorkflowView = "identity" | "profile" | "application" | "review";
export type AuthMode = "login" | "register";

const workflowPaths: Record<WorkflowView, string> = {
  identity: "/workspace/identity",
  profile: "/workspace/profile",
  application: "/workspace/application",
  review: "/workspace/review",
};

const authPaths: Record<AuthMode, string> = {
  login: "/login",
  register: "/register",
};

export interface WorkflowStep {
  id: WorkflowView;
  number: string;
  title: string;
  description: string;
  enabled: boolean;
  done: boolean;
}

export function getInitialWorkflowView(snapshot: SnapshotState): WorkflowView {
  const routedWorkflowView = getWorkflowViewFromPath(getCurrentPathname());
  if (routedWorkflowView) {
    return routedWorkflowView;
  }

  if (snapshot.sessionToken && snapshot.committeeDecisionState === "Approved") {
    return "review";
  }

  if (snapshot.sessionToken && snapshot.applicationCreateStatus === 201) {
    return "application";
  }

  if (snapshot.sessionToken || snapshot.accountStatus === "active") {
    return "profile";
  }

  return "identity";
}

export function getInitialAuthMode(): AuthMode {
  return getAuthModeFromPath(getCurrentPathname()) ?? "login";
}

export function getAuthPath(authMode: AuthMode) {
  return authPaths[authMode];
}

export function getWorkflowPath(workflowView: WorkflowView) {
  return workflowPaths[workflowView];
}

export function getAuthModeFromPath(pathname: string): AuthMode | null {
  if (pathname === "/register") {
    return "register";
  }

  if (pathname === "/" || pathname === "/login") {
    return "login";
  }

  return null;
}

export function getWorkflowViewFromPath(pathname: string): WorkflowView | null {
  if (pathname === "/workspace" || pathname === "/workspace/identity") {
    return "identity";
  }

  if (pathname === "/workspace/profile") {
    return "profile";
  }

  if (pathname === "/workspace/application" || pathname === "/workspace/applications") {
    return "application";
  }

  if (pathname === "/workspace/review") {
    return "review";
  }

  return null;
}

export function syncBrowserPath(pathname: string, replace = false) {
  if (typeof window === "undefined" || window.location.pathname === pathname) {
    return;
  }

  const nextUrl = `${pathname}${window.location.search}${window.location.hash}`;
  if (replace) {
    window.history.replaceState(null, "", nextUrl);
  } else {
    window.history.pushState(null, "", nextUrl);
  }
}

function getCurrentPathname() {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}
