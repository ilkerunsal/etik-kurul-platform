import type { SnapshotState } from "./demoState";

export type WorkflowView = "identity" | "profile" | "application" | "review";

export interface WorkflowStep {
  id: WorkflowView;
  number: string;
  title: string;
  description: string;
  enabled: boolean;
  done: boolean;
}

export function getInitialWorkflowView(snapshot: SnapshotState): WorkflowView {
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
