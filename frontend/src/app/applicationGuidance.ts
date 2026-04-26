import type {
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
  SessionUserResponse,
} from "../types";
import {
  formatApplicationRouteStatus,
  formatApplicationStep,
  formatApplicationSubmitStatus,
} from "./formatters";

export type GuidanceTone = "error" | "neutral" | "success";

export interface ApplicationGuidanceCard {
  description: string;
  number: string;
  status: string;
  title: string;
  tone: GuidanceTone;
}

interface ApplicationReadinessInput {
  currentUser: SessionUserResponse | null;
  hasSession: boolean;
}

interface ApplicationStageInput {
  applicationCommitteeCount: number | null;
  applicationCreateState: string | null;
  applicationCreateStatus: number | null;
  applicationSubmitState: string | null;
  applicationSubmitStatus: number | null;
  applicationValidation: ApplicationValidationResponse | null;
  currentApplication: ApplicationSummaryResponse | null;
}

function done(value: boolean): GuidanceTone {
  return value ? "success" : "neutral";
}

function statusTone(status: number | null, successStatus: number): GuidanceTone {
  if (status === null) {
    return "neutral";
  }

  return status === successStatus ? "success" : "error";
}

function validationStatus(applicationValidation: ApplicationValidationResponse | null, applicationSubmitStatus: number | null) {
  if (!applicationValidation) {
    return applicationSubmitStatus === 200 ? "Validation passed" : "Bekliyor";
  }

  return applicationValidation.isValid ? "Validation passed" : "Validation blocked";
}

export function getApplicationReadiness({ currentUser, hasSession }: ApplicationReadinessInput) {
  const checks = [
    hasSession,
    !!currentUser,
    currentUser?.accountStatus === "active",
    currentUser?.applicationAccess.canOpenApplication === true,
  ];
  const missing: string[] = [];

  if (!hasSession) {
    missing.push("Aktif JWT oturumu yok.");
  }

  if (!currentUser) {
    missing.push("Korumali /auth/me ozeti henuz yuklenmedi.");
  } else {
    if (currentUser.accountStatus !== "active") {
      missing.push("Hesap active durumunda degil.");
    }

    if (!currentUser.applicationAccess.canOpenApplication) {
      missing.push(`CanOpenApplication izin vermiyor: ${currentUser.applicationAccess.reasonCode}.`);
    }
  }

  const completed = checks.filter(Boolean).length;

  return {
    completed,
    missing,
    percent: Math.round((completed * 100) / checks.length),
    ready: missing.length === 0,
    total: checks.length,
  };
}

export function getApplicationStageCards({
  applicationCommitteeCount,
  applicationCreateState,
  applicationCreateStatus,
  applicationSubmitState,
  applicationSubmitStatus,
  applicationValidation,
  currentApplication,
}: ApplicationStageInput): ApplicationGuidanceCard[] {
  const draftReady = applicationCreateStatus === 201 || !!currentApplication;
  const entryModeReady = !!currentApplication?.entryMode;
  const committeeReady = !!currentApplication?.committeeId || applicationCommitteeCount !== null;
  const formReady = !!applicationValidation || applicationSubmitStatus !== null;
  const documentReady = !!applicationValidation || applicationSubmitStatus !== null;
  const validationReady = !!applicationValidation?.isValid || applicationSubmitStatus === 200;
  const validationFailed = (!!applicationValidation && !applicationValidation.isValid) || applicationSubmitStatus === 400;
  const draftStatus = draftReady || applicationCreateStatus !== null
    ? formatApplicationRouteStatus(applicationCreateStatus, applicationCreateState)
    : "Bekliyor";
  const draftTone = draftReady ? "success" : statusTone(applicationCreateStatus, 201);

  return [
    {
      description: "POST /applications ile arastirmaciya ait taslak olusturulur.",
      number: "01",
      status: draftStatus,
      title: "Taslak",
      tone: draftTone,
    },
    {
      description: "Guided entry mode secilir; sonraki intake ve yonlendirme adimlari bu modda ilerler.",
      number: "02",
      status: currentApplication?.entryMode ?? "Bekliyor",
      title: "Giris modu",
      tone: done(entryModeReady),
    },
    {
      description: "Intake yanitlari kaydedilir ve onerilen komite secimi yapilir.",
      number: "03",
      status: committeeReady ? `${applicationCommitteeCount ?? 1} komite hazir` : "Bekliyor",
      title: "Intake ve komite",
      tone: done(committeeReady),
    },
    {
      description: "clinical-main formu demo verisiyle %100 tamamlanmis olarak kaydedilir.",
      number: "04",
      status: formReady ? "Form verisi hazir" : "Bekliyor",
      title: "Form",
      tone: done(formReady),
    },
    {
      description: "Zorunlu consent_form dokumani mock storage anahtari ile eklenir.",
      number: "05",
      status: documentReady ? "Dokuman eklendi" : "Bekliyor",
      title: "Dokuman",
      tone: done(documentReady),
    },
    {
      description: "Sistem dogrulamasi gecerse basvuru uzman atama kuyruguna gonderilebilir.",
      number: "06",
      status: validationStatus(applicationValidation, applicationSubmitStatus),
      title: "Validation",
      tone: validationFailed ? "error" : done(validationReady),
    },
    {
      description: "Validation basariliyse submit ile WaitingExpertAssignment adimina gecilir.",
      number: "07",
      status: formatApplicationSubmitStatus(applicationSubmitStatus, applicationSubmitState),
      title: "Submit",
      tone: statusTone(applicationSubmitStatus, 200),
    },
  ];
}

export function getApplicationStageProgress(cards: ApplicationGuidanceCard[]) {
  const completed = cards.filter((card) => card.tone === "success").length;

  return {
    completed,
    percent: Math.round((completed * 100) / cards.length),
    total: cards.length,
  };
}

export function getApplicationValidationGuidance(
  applicationValidation: ApplicationValidationResponse | null,
  applicationSubmitStatus: number | null,
) {
  if (!applicationValidation) {
    if (applicationSubmitStatus === 200) {
      return ["Submit tamamlandi; validation checklist sonucu bu yerel snapshot'ta saklanmiyor."];
    }

    return ["Sistem dogrulamasi henuz calistirilmadi."];
  }

  if (applicationValidation.items.length === 0 && applicationValidation.isValid) {
    return [];
  }

  return applicationValidation.items.map((item) => {
    const message = item.message ? ` - ${item.message}` : "";
    return `${item.label}: ${item.status}${message}`;
  });
}

export function getApplicationSummaryLabel(application: ApplicationSummaryResponse | null) {
  if (!application) {
    return "Henuz taslak yok";
  }

  return `${application.status} / ${formatApplicationStep(application.currentStep)}`;
}
