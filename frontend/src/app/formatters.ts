import type {
  AccountStatus,
  ActivityEntry,
  ApplicationAccessResponse,
  ApplicationCurrentStep,
  ContactChannelType,
  CurrentProfileResponse,
  MockMessageResponse,
  ProfileForm,
  RegisterForm,
} from "../types";

export const statusLabels: Record<AccountStatus, string> = {
  pending_identity_check: "Kimlik kontrolu bekliyor",
  identity_failed: "Kimlik dogrulamasi basarisiz",
  contact_pending: "Iletisim onayi bekliyor",
  active: "Hesap aktif",
  suspended: "Hesap askida",
  archived: "Hesap arsivde",
};

export const statusDescriptions: Record<AccountStatus, string> = {
  pending_identity_check: "Kayit alindi. Siradaki adim NVI kimlik eslestirmesi.",
  identity_failed: "Mock NVI sonucu eslesmedi. Kayit verilerini gozden gecirip tekrar deneyin.",
  contact_pending: "Kimlik onaylandi. Email veya SMS kodu ile aktivasyon tamamlanabilir.",
  active: "Hesap aktif. Profil icin login olup JWT ile devam edebilirsiniz.",
  suspended: "Bu arayuzde askiya alma akisi uygulanmiyor.",
  archived: "Bu arayuzde arsivleme akisi uygulanmiyor.",
};

const applicationAccessLabels: Record<string, string> = {
  ready: "Basvuru acabilir",
  account_not_active: "Hesap aktif degil",
  profile_missing: "Profil eksik",
  profile_completion_below_minimum: "Profil orani yetersiz",
  minimum_profile_completion_not_configured: "Esik henuz tanimli degil",
};

export function createActivity(message: string, tone: ActivityEntry["tone"]): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    message,
    tone,
    timestamp: new Date().toISOString(),
  };
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function findLatestMessage(messages: MockMessageResponse[], channelType: ContactChannelType) {
  return messages.find((message) => message.channelType === channelType);
}

export function mapProfileToForm(profile: CurrentProfileResponse): ProfileForm {
  return {
    academicTitle: profile.academicTitle ?? "",
    degreeLevel: profile.degreeLevel ?? "",
    institutionName: profile.institutionName ?? "",
    facultyName: profile.facultyName ?? "",
    departmentName: profile.departmentName ?? "",
    positionTitle: profile.positionTitle ?? "",
    biography: profile.biography ?? "",
    specializationSummary: profile.specializationSummary ?? "",
    hasESignature: profile.hasESignature,
    kepAddress: profile.kepAddress ?? "",
    cvDocumentId: profile.cvDocumentId ?? "",
  };
}

export function formatExpertWorkflowStatus(status: number | null, state: string | null): string {
  if (status === null) {
    return "Calistirilmadi";
  }

  if (status === 200) {
    return state ?? "Tamamlandi";
  }

  return `${status}`;
}

export function createRoleDemoRegisterForm(label: string): RegisterForm {
  const seed = `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
  const tckn = `7${seed.slice(-10)}`;
  const suffix = seed.slice(-6);

  return {
    firstName: label,
    lastName: "Demo",
    tckn,
    birthDate: "1990-01-01",
    email: `${label.toLowerCase()}+${suffix}@example.com`,
    phone: `+90555${tckn.slice(-7)}`,
    password: "StrongPass123!",
  };
}

export function tokenPreview(value: string): string {
  if (!value) {
    return "Oturum yok";
  }

  return `${value.slice(0, 24)}...${value.slice(-12)}`;
}

export function formatApplicationAccess(access?: ApplicationAccessResponse | null): string {
  if (!access) {
    return "Degerlendirilmedi";
  }

  return access.canOpenApplication
    ? "Hazir"
    : (applicationAccessLabels[access.reasonCode] ?? access.reasonCode);
}

export function formatProbeStatus(status: number | null, state: string | null): string {
  if (status === null) {
    return "Calistirilmadi";
  }

  if (status === 200) {
    return state ?? "ready";
  }

  if (status === 403) {
    return "blocked";
  }

  return `${status}`;
}

export function formatApplicationRouteStatus(status: number | null, state: string | null): string {
  if (status === null) {
    return "Calistirilmadi";
  }

  if (status === 201) {
    return state ?? "Draft";
  }

  if (status === 403) {
    return "blocked";
  }

  return `${status}`;
}

export function formatApplicationSubmitStatus(status: number | null, state: string | null): string {
  if (status === null) {
    return "Calistirilmadi";
  }

  if (status === 200) {
    return state ?? "Submitted";
  }

  if (status === 400) {
    return "blocked";
  }

  return `${status}`;
}

export function formatApplicationStep(step: ApplicationCurrentStep | null | undefined): string {
  if (!step) {
    return "Henuz yok";
  }

  return step.replace(/([a-z])([A-Z])/g, "$1 $2");
}
