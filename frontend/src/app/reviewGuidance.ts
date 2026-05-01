import type { ApplicationSummaryResponse } from "../types";
import { formatApplicationStep, formatExpertWorkflowStatus } from "./formatters";
import type { GuidanceTone } from "./applicationGuidance";
import { isReviewCompletedStep, isReviewFlowStep } from "./reviewFlow";

export interface ReviewGuidanceCard {
  description: string;
  number: string;
  status: string;
  title: string;
  tone: GuidanceTone;
}

interface ReviewReadinessInput {
  currentApplication: ApplicationSummaryResponse | null;
  hasSession: boolean;
}

interface ReviewStageInput {
  agendaQueueCount: number | null;
  agendaState: string | null;
  agendaStatus: number | null;
  committeeDecisionState: string | null;
  committeeDecisionStatus: number | null;
  committeeRevisionResponseState: string | null;
  committeeRevisionResponseStatus: number | null;
  committeeRevisionState: string | null;
  committeeRevisionStatus: number | null;
  currentApplication: ApplicationSummaryResponse | null;
  expertAssignmentState: string | null;
  expertAssignmentStatus: number | null;
  expertDecisionState: string | null;
  expertDecisionStatus: number | null;
  expertQueueCount: number | null;
  expertReviewState: string | null;
  expertReviewStatus: number | null;
  packageQueueCount: number | null;
  packageState: string | null;
  packageStatus: number | null;
  revisionResponseState: string | null;
  revisionResponseStatus: number | null;
}

function done(status: number | null): GuidanceTone {
  if (status === null) {
    return "neutral";
  }

  return status === 200 ? "success" : "error";
}

function countStatus(count: number | null, label: string) {
  return count === null ? "Bekliyor" : `${count} ${label}`;
}

function completedStatus(isComplete: boolean, status: number | null, state: string | null) {
  if (isComplete && status === null) {
    return "Tamamlandi";
  }

  return formatExpertWorkflowStatus(status, state);
}

function completedTone(isComplete: boolean, status: number | null) {
  if (isComplete && status === null) {
    return "success";
  }

  return done(status);
}

export function getReviewReadiness({ currentApplication, hasSession }: ReviewReadinessInput) {
  const readyStep = isReviewFlowStep(currentApplication?.currentStep);
  const completed = isReviewCompletedStep(currentApplication?.currentStep);
  const checks = [hasSession, !!currentApplication, readyStep || completed];
  const missing: string[] = [];

  if (!hasSession) {
    missing.push("Aktif JWT oturumu yok.");
  }

  if (!currentApplication) {
    missing.push("Incelemeye gonderilmis basvuru bulunmuyor.");
  } else if (!readyStep && !completed) {
    missing.push(`Basvuru WaitingExpertAssignment adiminda degil: ${formatApplicationStep(currentApplication.currentStep)}.`);
  } else if (completed) {
    missing.push("Kurul karari tamamlandi; yeni demo icin yeni basvuru taslagi olusturun.");
  }

  const completedCount = checks.filter(Boolean).length;

  return {
    completed: completedCount,
    isComplete: completed,
    missing,
    percent: Math.round((completedCount * 100) / checks.length),
    ready: hasSession && readyStep,
    total: checks.length,
  };
}

export function getReviewStageCards({
  agendaQueueCount,
  agendaState,
  agendaStatus,
  committeeDecisionState,
  committeeDecisionStatus,
  committeeRevisionResponseState,
  committeeRevisionResponseStatus,
  committeeRevisionState,
  committeeRevisionStatus,
  currentApplication,
  expertAssignmentState,
  expertAssignmentStatus,
  expertDecisionState,
  expertDecisionStatus,
  expertQueueCount,
  expertReviewState,
  expertReviewStatus,
  packageQueueCount,
  packageState,
  packageStatus,
  revisionResponseState,
  revisionResponseStatus,
}: ReviewStageInput): ReviewGuidanceCard[] {
  const complete = currentApplication?.currentStep === "Approved";
  const queueSeen = complete || expertQueueCount !== null || currentApplication?.currentStep === "WaitingExpertAssignment";

  return [
    {
      description: "Secretariat rolu uzman atama kuyrugunda basvuruyu gorur.",
      number: "01",
      status: complete && expertQueueCount === null ? "Tamamlandi" : queueSeen ? countStatus(expertQueueCount, "basvuru") : "Bekliyor",
      title: "Atama kuyrugu",
      tone: complete || expertQueueCount !== null ? "success" : "neutral",
    },
    {
      description: "Secretariat basvuruyu mock ethics_expert kullanicisina atar.",
      number: "02",
      status: completedStatus(complete, expertAssignmentStatus, expertAssignmentState),
      title: "Uzman atama",
      tone: completedTone(complete, expertAssignmentStatus),
    },
    {
      description: "Uzman atanan isi acip incelemeyi baslatir.",
      number: "03",
      status: completedStatus(complete, expertReviewStatus, expertReviewState),
      title: "Uzman inceleme",
      tone: completedTone(complete, expertReviewStatus),
    },
    {
      description: "Uzman revizyon ister; arastirmaci kendi oturumuyla yanit verir.",
      number: "04",
      status: completedStatus(complete, revisionResponseStatus, revisionResponseState),
      title: "Revizyon yaniti",
      tone: completedTone(complete, revisionResponseStatus),
    },
    {
      description: "Uzman inceleme kararini Approved olarak kapatir.",
      number: "05",
      status: completedStatus(complete, expertDecisionStatus, expertDecisionState),
      title: "Uzman karari",
      tone: completedTone(complete, expertDecisionStatus),
    },
    {
      description: "Secretariat paketleme kuyrugunu kontrol eder ve kurul paketini hazirlar.",
      number: "06",
      status: packageQueueCount === null
        ? completedStatus(complete, packageStatus, packageState)
        : `${packageQueueCount} kuyruk / ${completedStatus(complete, packageStatus, packageState)}`,
      title: "Paket hazirligi",
      tone: completedTone(complete, packageStatus),
    },
    {
      description: "Hazir paket kurul gundemine eklenir.",
      number: "07",
      status: agendaQueueCount === null
        ? completedStatus(complete, agendaStatus, agendaState)
        : `${agendaQueueCount} kuyruk / ${completedStatus(complete, agendaStatus, agendaState)}`,
      title: "Kurul gundemi",
      tone: completedTone(complete, agendaStatus),
    },
    {
      description: "Kurul revizyon ister; arastirmaci kurul revizyonuna yanit verir.",
      number: "08",
      status: committeeRevisionStatus === null
        ? completedStatus(complete, committeeRevisionResponseStatus, committeeRevisionResponseState)
        : `${completedStatus(complete, committeeRevisionStatus, committeeRevisionState)} / ${completedStatus(complete, committeeRevisionResponseStatus, committeeRevisionResponseState)}`,
      title: "Kurul revizyonu",
      tone: completedTone(complete, committeeRevisionResponseStatus),
    },
    {
      description: "Secretariat kurul kararini Approved olarak kaydeder.",
      number: "09",
      status: completedStatus(complete, committeeDecisionStatus, committeeDecisionState),
      title: "Kurul karari",
      tone: completedTone(complete, committeeDecisionStatus),
    },
  ];
}

export function getReviewProgress(cards: ReviewGuidanceCard[]) {
  const completed = cards.filter((card) => card.tone === "success").length;

  return {
    completed,
    percent: Math.round((completed * 100) / cards.length),
    total: cards.length,
  };
}

export function getReviewDecisionItems(cards: ReviewGuidanceCard[]) {
  const incomplete = cards.filter((card) => card.tone !== "success");

  if (incomplete.length === 0) {
    return [];
  }

  return incomplete.map((card) => `${card.number} ${card.title}: ${card.status}`);
}
