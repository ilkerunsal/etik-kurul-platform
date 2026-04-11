import { startTransition, useDeferredValue, useEffect, useState, type FormEvent } from "react";
import {
  addApplicationDocument,
  confirmCode,
  createApplication,
  createProfile,
  fetchCommittees,
  fetchCurrentProfile,
  fetchCurrentUser,
  fetchMockMessages,
  getErrorMessage,
  isApiErrorStatus,
  loginUser,
  probeApplicationAccess,
  registerUser,
  saveApplicationForm,
  saveApplicationIntake,
  sendCode,
  selectApplicationCommittee,
  setApplicationEntryMode,
  updateProfile,
  validateApplication,
  verifyIdentity,
} from "./api";
import type {
  AccountStatus,
  ApplicationAccessResponse,
  ApplicationCurrentStep,
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
  ActivityEntry,
  ContactChannelType,
  CurrentProfileResponse,
  MockMessageResponse,
  ProfileForm,
  RegisterForm,
  SessionUserResponse,
} from "./types";

const STORAGE_KEY = "etik-kurul-phase1-ui:v3";

const emptyRegisterForm: RegisterForm = {
  firstName: "",
  lastName: "",
  tckn: "",
  birthDate: "",
  email: "",
  phone: "",
  password: "",
};

const emptyProfileForm: ProfileForm = {
  academicTitle: "",
  degreeLevel: "",
  institutionName: "",
  facultyName: "",
  departmentName: "",
  positionTitle: "",
  biography: "",
  specializationSummary: "",
  hasESignature: false,
  kepAddress: "",
  cvDocumentId: "",
};

const emptyCodes: Record<ContactChannelType, string> = { email: "", sms: "" };

const statusLabels: Record<AccountStatus, string> = {
  pending_identity_check: "Kimlik kontrolu bekliyor",
  identity_failed: "Kimlik dogrulamasi basarisiz",
  contact_pending: "Iletisim onayi bekliyor",
  active: "Hesap aktif",
  suspended: "Hesap askida",
  archived: "Hesap arsivde",
};

const statusDescriptions: Record<AccountStatus, string> = {
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

type BusyAction =
  | "register"
  | "verify-identity"
  | "refresh-messages"
  | "send-email"
  | "send-sms"
  | "confirm-email"
  | "confirm-sms"
  | "create-profile"
  | "update-profile"
  | "login"
  | "fetch-session"
  | "probe-application"
  | "create-application";

interface BannerState {
  tone: "success" | "error" | "neutral";
  title: string;
  detail: string;
}

interface SnapshotState {
  registerForm: RegisterForm;
  profileForm: ProfileForm;
  codes: Record<ContactChannelType, string>;
  userId: string;
  currentProfileId: string | null;
  accountStatus: AccountStatus | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompletionPercent: number | null;
  identityResponseCode: string | null;
  mockMessages: MockMessageResponse[];
  activity: ActivityEntry[];
  banner: BannerState | null;
  loginIdentifier: string;
  loginPassword: string;
  sessionToken: string;
  sessionExpiresAt: string | null;
  currentUser: SessionUserResponse | null;
  applicationProbeStatus: number | null;
  applicationProbeState: string | null;
  applicationCreateStatus: number | null;
  applicationCreateState: string | null;
}

function createDefaultSnapshot(): SnapshotState {
  return {
    registerForm: emptyRegisterForm,
    profileForm: emptyProfileForm,
    codes: emptyCodes,
    userId: "",
    currentProfileId: null,
    accountStatus: null,
    emailVerified: false,
    phoneVerified: false,
    profileCompletionPercent: null,
    identityResponseCode: null,
    mockMessages: [],
    activity: [],
    banner: null,
    loginIdentifier: "",
    loginPassword: "",
    sessionToken: "",
    sessionExpiresAt: null,
    currentUser: null,
    applicationProbeStatus: null,
    applicationProbeState: null,
    applicationCreateStatus: null,
    applicationCreateState: null,
  };
}

function normalizeCurrentUser(value: Partial<SessionUserResponse> | null | undefined): SessionUserResponse | null {
  if (!value || !value.applicationAccess) {
    return null;
  }

  return value as SessionUserResponse;
}

function loadSnapshot(): SnapshotState {
  if (typeof window === "undefined") {
    return createDefaultSnapshot();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultSnapshot();
    }

    const parsed = JSON.parse(raw) as Partial<SnapshotState>;
    return {
      registerForm: { ...emptyRegisterForm, ...parsed.registerForm },
      profileForm: { ...emptyProfileForm, ...parsed.profileForm },
      codes: { ...emptyCodes, ...parsed.codes },
      userId: parsed.userId ?? "",
      currentProfileId: parsed.currentProfileId ?? null,
      accountStatus: parsed.accountStatus ?? null,
      emailVerified: parsed.emailVerified ?? false,
      phoneVerified: parsed.phoneVerified ?? false,
      profileCompletionPercent: parsed.profileCompletionPercent ?? null,
      identityResponseCode: parsed.identityResponseCode ?? null,
      mockMessages: parsed.mockMessages ?? [],
      activity: parsed.activity ?? [],
      banner: parsed.banner ?? null,
      loginIdentifier: parsed.loginIdentifier ?? "",
      loginPassword: parsed.loginPassword ?? "",
      sessionToken: parsed.sessionToken ?? "",
      sessionExpiresAt: parsed.sessionExpiresAt ?? null,
      currentUser: normalizeCurrentUser(parsed.currentUser as Partial<SessionUserResponse> | null | undefined),
      applicationProbeStatus: parsed.applicationProbeStatus ?? null,
      applicationProbeState: parsed.applicationProbeState ?? null,
      applicationCreateStatus: parsed.applicationCreateStatus ?? null,
      applicationCreateState: parsed.applicationCreateState ?? null,
    };
  } catch {
    return createDefaultSnapshot();
  }
}

function createActivity(message: string, tone: ActivityEntry["tone"]): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    message,
    tone,
    timestamp: new Date().toISOString(),
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function findLatestMessage(messages: MockMessageResponse[], channelType: ContactChannelType) {
  return messages.find((message) => message.channelType === channelType);
}

function mapProfileToForm(profile: CurrentProfileResponse): ProfileForm {
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

function tokenPreview(value: string): string {
  if (!value) {
    return "Oturum yok";
  }

  return `${value.slice(0, 24)}...${value.slice(-12)}`;
}

function formatApplicationAccess(access?: ApplicationAccessResponse | null): string {
  if (!access) {
    return "Degerlendirilmedi";
  }

  return access.canOpenApplication
    ? "Hazir"
    : (applicationAccessLabels[access.reasonCode] ?? access.reasonCode);
}

function formatProbeStatus(status: number | null, state: string | null): string {
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

function formatApplicationRouteStatus(status: number | null, state: string | null): string {
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

function formatApplicationStep(step: ApplicationCurrentStep | null | undefined): string {
  if (!step) {
    return "Henuz yok";
  }

  return step.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function StatusBadge({ accountStatus }: { accountStatus: AccountStatus | null }) {
  if (!accountStatus) {
    return <span className="status-badge status-badge--idle">Akis hazir</span>;
  }

  return <span className={`status-badge status-badge--${accountStatus}`}>{statusLabels[accountStatus]}</span>;
}

function ActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) {
    return <p className="empty-note">Henuz islem yapilmadi. Kayit adimiyla baslayin.</p>;
  }

  return (
    <ul className="activity-list">
      {activity.map((entry) => (
        <li key={entry.id} className={`activity-item activity-item--${entry.tone}`}>
          <strong>{entry.message}</strong>
          <span>{formatDate(entry.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}

function MessagePreview({
  channelType,
  message,
  onUseCode,
}: {
  channelType: ContactChannelType;
  message?: MockMessageResponse;
  onUseCode: (channelType: ContactChannelType, code: string) => void;
}) {
  const label = channelType === "email" ? "Email" : "SMS";

  if (!message) {
    return (
      <div className="message-preview message-preview--empty">
        <span>{label} kutusu bos</span>
        <small>Kod olustugunda mock mesaj burada gorunecek.</small>
      </div>
    );
  }

  return (
    <div className="message-preview">
      <div className="message-preview__header">
        <span>{label}</span>
        <strong>{message.recipient}</strong>
      </div>
      <p>{message.body}</p>
      <div className="message-preview__footer">
        <small>{formatDate(message.sentAt)}</small>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => message.code && onUseCode(channelType, message.code)}
          disabled={!message.code}
        >
          Son kodu yerlestir
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const snapshot = loadSnapshot();
  const [registerForm, setRegisterForm] = useState(snapshot.registerForm);
  const [profileForm, setProfileForm] = useState(snapshot.profileForm);
  const [codes, setCodes] = useState(snapshot.codes);
  const [userId, setUserId] = useState(snapshot.userId);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(snapshot.currentProfileId);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(snapshot.accountStatus);
  const [emailVerified, setEmailVerified] = useState(snapshot.emailVerified);
  const [phoneVerified, setPhoneVerified] = useState(snapshot.phoneVerified);
  const [profileCompletionPercent, setProfileCompletionPercent] = useState(snapshot.profileCompletionPercent);
  const [identityResponseCode, setIdentityResponseCode] = useState(snapshot.identityResponseCode);
  const [mockMessages, setMockMessages] = useState(snapshot.mockMessages);
  const [activity, setActivity] = useState(snapshot.activity);
  const [banner, setBanner] = useState<BannerState | null>(snapshot.banner);
  const [loginIdentifier, setLoginIdentifier] = useState(snapshot.loginIdentifier);
  const [loginPassword, setLoginPassword] = useState(snapshot.loginPassword);
  const [sessionToken, setSessionToken] = useState(snapshot.sessionToken);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(snapshot.sessionExpiresAt);
  const [currentUser, setCurrentUser] = useState<SessionUserResponse | null>(snapshot.currentUser);
  const [applicationProbeStatus, setApplicationProbeStatus] = useState<number | null>(snapshot.applicationProbeStatus);
  const [applicationProbeState, setApplicationProbeState] = useState<string | null>(snapshot.applicationProbeState);
  const [applicationCreateStatus, setApplicationCreateStatus] = useState<number | null>(snapshot.applicationCreateStatus);
  const [applicationCreateState, setApplicationCreateState] = useState<string | null>(snapshot.applicationCreateState);
  const [currentApplication, setCurrentApplication] = useState<ApplicationSummaryResponse | null>(null);
  const [applicationValidation, setApplicationValidation] = useState<ApplicationValidationResponse | null>(null);
  const [applicationCommitteeCount, setApplicationCommitteeCount] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);

  const deferredActivity = useDeferredValue(activity);
  const latestEmailMessage = findLatestMessage(mockMessages, "email");
  const latestSmsMessage = findLatestMessage(mockMessages, "sms");
  const hasSession = !!sessionToken;
  const hasExistingProfile = !!currentProfileId;
  const canVerifyIdentity = !!userId && (accountStatus === "pending_identity_check" || accountStatus === "identity_failed");
  const canManageContacts = !!userId && (accountStatus === "contact_pending" || accountStatus === "active");
  const canCreateProfile = accountStatus === "active" && hasSession;

  useEffect(() => {
    const payload: SnapshotState = {
      registerForm,
      profileForm,
      codes,
      userId,
      currentProfileId,
      accountStatus,
      emailVerified,
      phoneVerified,
      profileCompletionPercent,
      identityResponseCode,
      mockMessages,
      activity,
      banner,
      loginIdentifier,
      loginPassword,
      sessionToken,
      sessionExpiresAt,
      currentUser,
      applicationProbeStatus,
      applicationProbeState,
      applicationCreateStatus,
      applicationCreateState,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    activity,
    accountStatus,
    banner,
    codes,
    emailVerified,
    currentUser,
    currentProfileId,
    identityResponseCode,
    loginIdentifier,
    loginPassword,
    mockMessages,
    applicationProbeState,
    applicationProbeStatus,
    applicationCreateState,
    applicationCreateStatus,
    phoneVerified,
    profileCompletionPercent,
    profileForm,
    registerForm,
    sessionExpiresAt,
    sessionToken,
    userId,
  ]);

  function pushActivity(message: string, tone: ActivityEntry["tone"]) {
    startTransition(() => {
      setActivity((current) => [createActivity(message, tone), ...current].slice(0, 12));
    });
  }

  function applyUserSnapshot(user: SessionUserResponse) {
    setCurrentUser(user);
    setAccountStatus(user.accountStatus);
    setEmailVerified(user.emailVerified);
    setPhoneVerified(user.phoneVerified);
    setProfileCompletionPercent(user.profileCompletionPercent);
  }

  function applyProfileSnapshot(profile: CurrentProfileResponse) {
    setCurrentProfileId(profile.profileId);
    setUserId(profile.userId);
    setProfileForm(mapProfileToForm(profile));
    setProfileCompletionPercent(profile.profileCompletionPercent);
  }

  async function loadCurrentProfile(accessToken: string) {
    try {
      return await fetchCurrentProfile(accessToken);
    } catch (error) {
      if (isApiErrorStatus(error, 404)) {
        return null;
      }

      throw error;
    }
  }

  async function refreshSessionState(accessToken: string) {
    const [currentUserResponse, currentProfileResponse] = await Promise.all([
      fetchCurrentUser(accessToken),
      loadCurrentProfile(accessToken),
    ]);

    startTransition(() => {
      applyUserSnapshot(currentUserResponse.user);
      setUserId(currentUserResponse.user.userId);
      if (currentProfileResponse) {
        applyProfileSnapshot(currentProfileResponse);
      } else {
        setCurrentProfileId(null);
      }
    });
  }

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    let cancelled = false;

    async function bootstrapSession() {
      try {
        if (cancelled) {
          return;
        }

        await refreshSessionState(sessionToken);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBanner({
          tone: "error",
          title: "Oturum yenilenemedi",
          detail: getErrorMessage(error),
        });
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  async function refreshMockInbox(silent = false) {
    if (!registerForm.email && !registerForm.phone) {
      return;
    }

    try {
      const messages = await fetchMockMessages(registerForm.email, registerForm.phone);
      setMockMessages(messages);
      if (!silent) {
        pushActivity("Mock mesaj kutusu guncellendi.", "neutral");
      }
    } catch (error) {
      setBanner({ tone: "error", title: "Mock mesajlar okunamadi", detail: getErrorMessage(error) });
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("register");

    try {
      const response = await registerUser(registerForm);
      setUserId(response.userId);
      setCurrentProfileId(null);
      setAccountStatus(response.accountStatus);
      setEmailVerified(false);
      setPhoneVerified(false);
      setIdentityResponseCode(null);
      setProfileCompletionPercent(null);
      setMockMessages([]);
      setCodes({ ...emptyCodes });
      setCurrentUser(null);
      setApplicationProbeStatus(null);
      setApplicationProbeState(null);
      setApplicationCreateStatus(null);
      setApplicationCreateState(null);
      setCurrentApplication(null);
      setApplicationValidation(null);
      setApplicationCommitteeCount(null);
      setSessionToken("");
      setSessionExpiresAt(null);
      setLoginIdentifier(registerForm.email || registerForm.phone);
      setLoginPassword(registerForm.password);
      setBanner({ tone: "success", title: "Kayit olusturuldu", detail: "Siradaki adim NVI dogrulamasini baslatmak." });
      pushActivity("Kayit tamamlandi. Kimlik dogrulamasi bekleniyor.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Kayit basarisiz", detail: getErrorMessage(error) });
      pushActivity("Kayit istegi reddedildi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleVerifyIdentity() {
    if (!userId) {
      return;
    }

    setBusyAction("verify-identity");

    try {
      const response = await verifyIdentity(userId);
      setAccountStatus(response.accountStatus);
      setIdentityResponseCode(response.responseCode);
      await refreshMockInbox(true);
      if (response.success) {
        setBanner({ tone: "success", title: "Kimlik eslestirildi", detail: "Mock email ve SMS kodlari asagida hazir." });
        pushActivity("NVI dogrulamasi basarili. Iletisim kodlari uretildi.", "success");
      } else {
        setBanner({ tone: "error", title: "Kimlik eslestirilemedi", detail: `Provider cevabi: ${response.responseCode}` });
        pushActivity("Kimlik dogrulamasi basarisiz dondu.", "error");
      }
    } catch (error) {
      setBanner({ tone: "error", title: "Kimlik dogrulamasi tamamlanamadi", detail: getErrorMessage(error) });
      pushActivity("Kimlik dogrulamasi cagrisi hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSendCode(channelType: ContactChannelType) {
    if (!userId) {
      return;
    }

    setBusyAction(channelType === "email" ? "send-email" : "send-sms");

    try {
      const response = await sendCode(userId, channelType);
      setAccountStatus(response.accountStatus);
      await refreshMockInbox(true);
      setBanner({
        tone: "neutral",
        title: `${channelType === "email" ? "Email" : "SMS"} kodu yenilendi`,
        detail: `Kodun son gecerlilik zamani: ${formatDate(response.expiresAt)}.`,
      });
      pushActivity(`${channelType === "email" ? "Email" : "SMS"} icin yeni kod olusturuldu.`, "neutral");
    } catch (error) {
      setBanner({ tone: "error", title: "Kod olusturulamadi", detail: getErrorMessage(error) });
      pushActivity("Yeni dogrulama kodu olusturma istegi basarisiz oldu.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleConfirmCode(channelType: ContactChannelType) {
    if (!userId || !codes[channelType]) {
      return;
    }

    setBusyAction(channelType === "email" ? "confirm-email" : "confirm-sms");

    try {
      const response = await confirmCode(userId, channelType, codes[channelType]);
      setEmailVerified(response.emailVerified);
      setPhoneVerified(response.phoneVerified);
      setAccountStatus(response.accountStatus);
      setCodes((current) => ({ ...current, [channelType]: "" }));
      setBanner({
        tone: "success",
        title: `${channelType === "email" ? "Email" : "SMS"} onaylandi`,
        detail: response.accountStatus === "active" ? "Hesap aktif. Profil ve oturum paneli hazir." : "Diger kanali da isterseniz onaylayabilirsiniz.",
      });
      pushActivity(`${channelType === "email" ? "Email" : "SMS"} dogrulama kodu onaylandi.`, "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Kod onayi basarisiz", detail: getErrorMessage(error) });
      pushActivity("Iletisim kodu onayi gecemedi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionToken) {
      return;
    }

    setBusyAction(hasExistingProfile ? "update-profile" : "create-profile");

    try {
      if (hasExistingProfile) {
        const response = await updateProfile(sessionToken, profileForm);
        applyProfileSnapshot(response);
        await refreshSessionState(sessionToken);
        setBanner({
          tone: "success",
          title: "Profil guncellendi",
          detail: `Tamamlama orani: %${response.profileCompletionPercent}.`,
        });
        pushActivity("Profil formu guncellendi.", "success");
      } else {
        const response = await createProfile(sessionToken, profileForm);
        setCurrentProfileId(response.profileId);
        setUserId(response.userId);
        setProfileCompletionPercent(response.profileCompletionPercent);
        await refreshSessionState(sessionToken);
        setBanner({
          tone: "success",
          title: "Profil kaydedildi",
          detail: `Tamamlama orani: %${response.profileCompletionPercent}.`,
        });
        pushActivity("Profil formu olusturuldu.", "success");
      }
    } catch (error) {
      setBanner({ tone: "error", title: "Profil kaydedilemedi", detail: getErrorMessage(error) });
      pushActivity("Profil kaydi basarisiz oldu.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleLogin() {
    setBusyAction("login");

    try {
      const response = await loginUser(loginIdentifier, loginPassword);
      setSessionToken(response.accessToken);
      setSessionExpiresAt(response.expiresAt);
      applyUserSnapshot(response.user);
      setUserId(response.user.userId);
      setBanner({ tone: "success", title: "Oturum acildi", detail: "JWT token olusturuldu. Artik /auth/me sorgusu yapabilirsiniz." });
      pushActivity("JWT tabanli oturum baslatildi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Login basarisiz", detail: getErrorMessage(error) });
      pushActivity("Login istegi basarisiz oldu.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleFetchSession() {
    if (!sessionToken) {
      return;
    }

    setBusyAction("fetch-session");

    try {
      await refreshSessionState(sessionToken);
      setBanner({ tone: "neutral", title: "Oturum bilgisi yenilendi", detail: "Korumali /auth/me ve /profile/me endpointleri aktif session ile cevap verdi." });
      pushActivity("Session endpointleri basariyla okundu.", "neutral");
    } catch (error) {
      setBanner({ tone: "error", title: "Me sorgusu basarisiz", detail: getErrorMessage(error) });
      pushActivity("Me endpointi okunamadi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleProbeApplicationAccess() {
    if (!sessionToken) {
      return;
    }

    setBusyAction("probe-application");

    try {
      const response = await probeApplicationAccess(sessionToken);
      setApplicationProbeStatus(200);
      setApplicationProbeState(response.status);
      setBanner({
        tone: "success",
        title: "Policy probe gecti",
        detail: "CanOpenApplication policy kontrolu izin verdi.",
      });
      pushActivity("Application access probe 200 dondu.", "success");
    } catch (error) {
      if (isApiErrorStatus(error, 403)) {
        setApplicationProbeStatus(403);
        setApplicationProbeState("blocked");
        setBanner({
          tone: "neutral",
          title: "Policy probe engellendi",
          detail: "CanOpenApplication policy kontrolu 403 dondu.",
        });
        pushActivity("Application access probe 403 dondu.", "neutral");
      } else {
        setBanner({ tone: "error", title: "Policy probe basarisiz", detail: getErrorMessage(error) });
        pushActivity("Application access probe hata verdi.", "error");
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateApplicationRoute() {
    if (!sessionToken) {
      return;
    }

    setBusyAction("create-application");

    try {
      const committees = await fetchCommittees(sessionToken);
      const selectedCommittee = committees[0];

      if (!selectedCommittee) {
        throw new Error("Aktif komite bulunamadi.");
      }

      const createdApplication = await createApplication(
        sessionToken,
        "Demo Basvurusu",
        "UI uzerinden olusturulan applications demo akisi.",
      );
      await setApplicationEntryMode(sessionToken, createdApplication.applicationId, "Guided");
      await saveApplicationIntake(sessionToken, createdApplication.applicationId, {
        answers: {
          researchArea: "clinical",
          participantCount: 12,
          requiresSpecialReview: false,
        },
        suggestedCommitteeId: selectedCommittee.committeeId,
        alternativeCommittees: [selectedCommittee.committeeId],
        confidenceScore: 0.93,
        explanationText: "UI demo intake verisi.",
      });

      const committeeSelection = await selectApplicationCommittee(
        sessionToken,
        createdApplication.applicationId,
        selectedCommittee.committeeId,
        "guided",
      );

      const formResponse = await saveApplicationForm(
        sessionToken,
        createdApplication.applicationId,
        "clinical-main",
        {
          versionNo: 1,
          data: {
            studyTitle: "Demo Basvurusu",
            participantCount: 12,
            method: "Prospective",
          },
          completionPercent: 100,
        },
      );

      const documentResponse = await addApplicationDocument(
        sessionToken,
        createdApplication.applicationId,
        {
          documentType: "consent_form",
          sourceType: "upload",
          originalFileName: "consent.pdf",
          storageKey: "mock://documents/consent.pdf",
          mimeType: "application/pdf",
          versionNo: 1,
          isRequired: true,
        },
      );

      const validationResponse = await validateApplication(sessionToken, createdApplication.applicationId);
      const finalApplication: ApplicationSummaryResponse = {
        ...documentResponse.application,
        status: validationResponse.status,
        currentStep: validationResponse.currentStep,
      };

      startTransition(() => {
        setApplicationCommitteeCount(committees.length);
        setCurrentApplication(finalApplication);
        setApplicationValidation(validationResponse);
      });
      setApplicationCreateStatus(201);
      setApplicationCreateState(validationResponse.currentStep);
      setBanner({
        tone: "success",
        title: "Basvuru akisi tamamlandi",
        detail: validationResponse.isValid
          ? "Taslak olusturuldu ve validation tabani gecti."
          : "Taslak olusturuldu fakat validation tabani bloklandi.",
      });
      pushActivity(
        `Applications akisi create -> entry mode -> intake -> committee -> form -> document -> validate ile tamamlandi (${committeeSelection.currentStep}, form %${formResponse.completionPercent}).`,
        validationResponse.isValid ? "success" : "neutral",
      );
    } catch (error) {
      if (isApiErrorStatus(error, 403)) {
        setApplicationCreateStatus(403);
        setApplicationCreateState("blocked");
        setCurrentApplication(null);
        setApplicationValidation(null);
        setApplicationCommitteeCount(null);
        setBanner({
          tone: "neutral",
          title: "Route policy tarafindan engellendi",
          detail: "POST /applications istegi 403 dondu.",
        });
        pushActivity("POST /applications 403 dondu.", "neutral");
      } else {
        setBanner({ tone: "error", title: "Route cagrisi basarisiz", detail: getErrorMessage(error) });
        pushActivity("POST /applications hata verdi.", "error");
      }
    } finally {
      setBusyAction(null);
    }
  }

  function handleLogout() {
    setCurrentProfileId(null);
    setApplicationProbeStatus(null);
    setApplicationProbeState(null);
    setApplicationCreateStatus(null);
    setApplicationCreateState(null);
    setCurrentApplication(null);
    setApplicationValidation(null);
    setApplicationCommitteeCount(null);
    setSessionToken("");
    setSessionExpiresAt(null);
    setCurrentUser(null);
    setBanner({ tone: "neutral", title: "Oturum kapatildi", detail: "Yerel token bellegi temizlendi." });
    pushActivity("JWT oturumu temizlendi.", "neutral");
  }

  function resetWorkflow() {
    const next = createDefaultSnapshot();
    setRegisterForm(next.registerForm);
    setProfileForm(next.profileForm);
    setCodes(next.codes);
    setUserId(next.userId);
    setCurrentProfileId(next.currentProfileId);
    setAccountStatus(next.accountStatus);
    setEmailVerified(next.emailVerified);
    setPhoneVerified(next.phoneVerified);
    setProfileCompletionPercent(next.profileCompletionPercent);
    setIdentityResponseCode(next.identityResponseCode);
    setMockMessages(next.mockMessages);
    setActivity(next.activity);
    setBanner(next.banner);
    setLoginIdentifier(next.loginIdentifier);
    setLoginPassword(next.loginPassword);
    setSessionToken(next.sessionToken);
    setSessionExpiresAt(next.sessionExpiresAt);
    setCurrentUser(next.currentUser);
    setApplicationProbeStatus(next.applicationProbeStatus);
    setApplicationProbeState(next.applicationProbeState);
    setApplicationCreateStatus(next.applicationCreateStatus);
    setApplicationCreateState(next.applicationCreateState);
    setCurrentApplication(null);
    setApplicationValidation(null);
    setApplicationCommitteeCount(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="app-shell">
      <aside className="hero-column">
        <div className="hero-panel">
          <span className="eyebrow">Etik Kurul Basvuru Sistemi</span>
          <h1>Faz 1 durum merkezi</h1>
          <p className="hero-copy">Kayit, NVI kontrolu, iletisim onayi, profil tamamlama, JWT oturumu ve ilk basvuru taslagi akisini tek ekranda yonetin.</p>
          <div className="hero-metrics">
            <div><span>Durum</span><strong>{accountStatus ? statusLabels[accountStatus] : "Baslangic"}</strong></div>
            <div><span>Profil</span><strong>{profileCompletionPercent === null ? "Henus yok" : `%${profileCompletionPercent}`}</strong></div>
            <div><span>Kullanici</span><strong>{userId ? `${userId.slice(0, 8)}...` : "Olusmadi"}</strong></div>
            <div><span>Basvuru</span><strong>{formatApplicationAccess(currentUser?.applicationAccess)}</strong></div>
          </div>
          <div className="hero-note">
            <StatusBadge accountStatus={accountStatus} />
            <p>{accountStatus ? statusDescriptions[accountStatus] : "Adimlari sirayla tamamlayin."}</p>
            <small>Mock NVI basarisiz ornegi icin TCKN olarak 00000000000 kullanabilirsiniz.</small>
          </div>
          <div className="verification-strip">
            <div><span>Email</span><strong>{emailVerified ? "Onayli" : "Bekliyor"}</strong></div>
            <div><span>SMS</span><strong>{phoneVerified ? "Onayli" : "Bekliyor"}</strong></div>
            <div><span>JWT</span><strong>{hasSession ? "Hazir" : "Yok"}</strong></div>
          </div>
          <div className="activity-panel">
            <div className="section-heading"><span>Son olaylar</span><button type="button" className="button button--ghost" onClick={resetWorkflow}>Akisi sifirla</button></div>
            <ActivityFeed activity={deferredActivity} />
          </div>
        </div>
      </aside>
      <main className="workspace">
        <div className="workspace-header">
          <div><span className="eyebrow">Moduler monolit istemci</span><h2>Kimlik, profil, oturum ve basvuru operasyonlari</h2></div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => { setBusyAction("refresh-messages"); void refreshMockInbox().finally(() => setBusyAction(null)); }}
            disabled={busyAction === "refresh-messages" || (!registerForm.email && !registerForm.phone)}
          >
            {busyAction === "refresh-messages" ? "Kutular okunuyor" : "Mock kutulari yenile"}
          </button>
        </div>
        {banner ? <section className={`banner banner--${banner.tone}`}><strong>{banner.title}</strong><p>{banner.detail}</p></section> : null}
        <div className="panel-grid">
          <section className="panel panel--form">
            <div className="section-heading"><span>01</span><div><h3>Kayit formu</h3><p>Kullanici ve sifre bilgilerini toplayip hesabin ilk kaydini olusturur.</p></div></div>
            <form className="form-grid" onSubmit={handleRegister}>
              <label className="field"><span>Ad</span><input required value={registerForm.firstName} onChange={(event) => setRegisterForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
              <label className="field"><span>Soyad</span><input required value={registerForm.lastName} onChange={(event) => setRegisterForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
              <label className="field"><span>TCKN</span><input required pattern="\d{11}" inputMode="numeric" value={registerForm.tckn} onChange={(event) => setRegisterForm((current) => ({ ...current, tckn: event.target.value }))} /></label>
              <label className="field"><span>Dogum tarihi</span><input required type="date" value={registerForm.birthDate} onChange={(event) => setRegisterForm((current) => ({ ...current, birthDate: event.target.value }))} /></label>
              <label className="field"><span>Email</span><input required type="email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} /></label>
              <label className="field"><span>Telefon</span><input required value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} /></label>
              <label className="field field--full"><span>Sifre</span><input required type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} /></label>
              <div className="actions field--full"><button type="submit" className="button" disabled={busyAction === "register"}>{busyAction === "register" ? "Kaydediliyor" : "Kaydi olustur"}</button><small>Basarili kayit sonrasi varsayilan researcher rolu atanir.</small></div>
            </form>
          </section>
          <section className="panel panel--accent">
            <div className="section-heading"><span>02</span><div><h3>NVI dogrulama</h3><p>Sifrelenmis TCKN ve dogum tarihi backend tarafinda cozulup mock provider ile eslestirilir.</p></div></div>
            <div className="identity-summary">
              <div><span>Kullanici Id</span><strong>{userId || "Kayit bekleniyor"}</strong></div>
              <div><span>Son provider kodu</span><strong>{identityResponseCode ?? "Calismadi"}</strong></div>
            </div>
            <button type="button" className="button" disabled={!canVerifyIdentity || busyAction === "verify-identity"} onClick={handleVerifyIdentity}>{busyAction === "verify-identity" ? "Dogrulaniyor" : "Kimlik dogrulamayi baslat"}</button>
          </section>
          <section className="panel panel--wide">
            <div className="section-heading"><span>03</span><div><h3>Iletisim kodlari</h3><p>Mock email ve SMS kutulari gelistirme amacli okunur. Kodlari tek tikla alana yerlestirebilirsiniz.</p></div></div>
            <div className="channel-grid">
              <div className="channel-card">
                <div className="channel-card__header"><div><h4>Email onayi</h4><span>{emailVerified ? "Onaylandi" : "Bekliyor"}</span></div><button type="button" className="button button--ghost" disabled={!canManageContacts || busyAction === "send-email"} onClick={() => void handleSendCode("email")}>{busyAction === "send-email" ? "Gonderiliyor" : "Yeni email kodu"}</button></div>
                <MessagePreview channelType="email" message={latestEmailMessage} onUseCode={(channelType, code) => setCodes((current) => ({ ...current, [channelType]: code }))} />
                <div className="inline-form"><input placeholder="Email kodu" value={codes.email} onChange={(event) => setCodes((current) => ({ ...current, email: event.target.value }))} /><button type="button" className="button" disabled={!canManageContacts || !codes.email || busyAction === "confirm-email"} onClick={() => void handleConfirmCode("email")}>{busyAction === "confirm-email" ? "Onaylaniyor" : "Email kodunu onayla"}</button></div>
              </div>
              <div className="channel-card">
                <div className="channel-card__header"><div><h4>SMS onayi</h4><span>{phoneVerified ? "Onaylandi" : "Bekliyor"}</span></div><button type="button" className="button button--ghost" disabled={!canManageContacts || busyAction === "send-sms"} onClick={() => void handleSendCode("sms")}>{busyAction === "send-sms" ? "Gonderiliyor" : "Yeni SMS kodu"}</button></div>
                <MessagePreview channelType="sms" message={latestSmsMessage} onUseCode={(channelType, code) => setCodes((current) => ({ ...current, [channelType]: code }))} />
                <div className="inline-form"><input placeholder="SMS kodu" value={codes.sms} onChange={(event) => setCodes((current) => ({ ...current, sms: event.target.value }))} /><button type="button" className="button" disabled={!canManageContacts || !codes.sms || busyAction === "confirm-sms"} onClick={() => void handleConfirmCode("sms")}>{busyAction === "confirm-sms" ? "Onaylaniyor" : "SMS kodunu onayla"}</button></div>
              </div>
            </div>
          </section>
          <section className="panel panel--form panel--wide">
            <div className="section-heading"><span>04</span><div><h3>Profil olusturma</h3><p>E-imza ve KEP dahil Faz 1 profil alanlarini doldurur. Aktif JWT oturumu varsa mevcut profil otomatik yuklenir ve ayni formdan guncellenebilir.</p></div></div>
            <form className="form-grid" onSubmit={handleCreateProfile}>
              <label className="field"><span>Akademik unvan</span><input value={profileForm.academicTitle} onChange={(event) => setProfileForm((current) => ({ ...current, academicTitle: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field"><span>Derece duzeyi</span><input value={profileForm.degreeLevel} onChange={(event) => setProfileForm((current) => ({ ...current, degreeLevel: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field"><span>Kurum</span><input value={profileForm.institutionName} onChange={(event) => setProfileForm((current) => ({ ...current, institutionName: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field"><span>Fakulte</span><input value={profileForm.facultyName} onChange={(event) => setProfileForm((current) => ({ ...current, facultyName: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field"><span>Bolum</span><input value={profileForm.departmentName} onChange={(event) => setProfileForm((current) => ({ ...current, departmentName: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field"><span>Pozisyon</span><input value={profileForm.positionTitle} onChange={(event) => setProfileForm((current) => ({ ...current, positionTitle: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field field--full"><span>Biyografi</span><textarea rows={4} value={profileForm.biography} onChange={(event) => setProfileForm((current) => ({ ...current, biography: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field field--full"><span>Uzmanlik ozeti</span><textarea rows={4} value={profileForm.specializationSummary} onChange={(event) => setProfileForm((current) => ({ ...current, specializationSummary: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field"><span>KEP adresi</span><input value={profileForm.kepAddress} onChange={(event) => setProfileForm((current) => ({ ...current, kepAddress: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field"><span>CV dokuman Id</span><input value={profileForm.cvDocumentId} onChange={(event) => setProfileForm((current) => ({ ...current, cvDocumentId: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field field--toggle"><span>E-imza mevcut</span><input type="checkbox" checked={profileForm.hasESignature} onChange={(event) => setProfileForm((current) => ({ ...current, hasESignature: event.target.checked }))} disabled={!canCreateProfile} /></label>
              <div className="actions field--full"><button type="submit" className="button" disabled={!canCreateProfile || busyAction === "create-profile" || busyAction === "update-profile"}>{busyAction === "create-profile" || busyAction === "update-profile" ? "Kaydediliyor" : hasExistingProfile ? "Profili guncelle" : "Profili olustur"}</button><small>{!hasSession ? "Profil kaydi icin once login olun." : hasExistingProfile ? `Mevcut profil yuklendi. Guncel oran: %${profileCompletionPercent ?? 0}` : profileCompletionPercent === null ? "Profil orani backend cevabindan doner." : `Guncel tamamlanma orani: %${profileCompletionPercent}`}</small></div>
            </form>
          </section>
          <section className="panel panel--accent panel--wide">
            <div className="section-heading"><span>05</span><div><h3>JWT oturum ve basvuru demosu</h3><p>Aktif hesapla login olun, access token alin ve policy gecerse gercek applications akis demo cagrilarini bu panelden calistirin.</p></div></div>
            <div className="form-grid">
              <label className="field"><span>Email veya telefon</span><input value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} /></label>
              <label className="field"><span>Sifre</span><input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>
            </div>
            <div className="actions actions--cluster">
              <button type="button" className="button" disabled={!loginIdentifier || !loginPassword || busyAction === "login"} onClick={() => void handleLogin()}>{busyAction === "login" ? "Oturum aciliyor" : "Login ol"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "fetch-session"} onClick={() => void handleFetchSession()}>{busyAction === "fetch-session" ? "Sorgulaniyor" : "Me bilgisini getir"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "probe-application"} onClick={() => void handleProbeApplicationAccess()}>{busyAction === "probe-application" ? "Probe calisiyor" : "Policy probe"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "create-application"} onClick={() => void handleCreateApplicationRoute()}>{busyAction === "create-application" ? "Akis calisiyor" : "Basvuru demo akisi"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession} onClick={handleLogout}>Oturumu temizle</button>
            </div>
            <div className="session-stack">
              <div className="message-preview">
                <div className="message-preview__header"><span>Access token</span><strong>{hasSession ? "Hazir" : "Yok"}</strong></div>
                <p className="token-preview">{tokenPreview(sessionToken)}</p>
                <small>{sessionExpiresAt ? `Gecerlilik bitisi: ${formatDate(sessionExpiresAt)}` : "Henuz token uretilmedi."}</small>
              </div>
              <div className="message-preview">
                <div className="message-preview__header"><span>Me yaniti</span><strong>{currentUser ? currentUser.email : "Okunmadi"}</strong></div>
                {currentUser ? (
                  <div className="meta-list">
                    <div><span>Ad Soyad</span><strong>{`${currentUser.firstName} ${currentUser.lastName}`}</strong></div>
                    <div><span>Roller</span><strong>{currentUser.roles.join(", ") || "Yok"}</strong></div>
                    <div><span>Durum</span><strong>{statusLabels[currentUser.accountStatus]}</strong></div>
                    <div><span>Profil</span><strong>{currentUser.profileCompletionPercent === null ? "Yok" : `%${currentUser.profileCompletionPercent}`}</strong></div>
                    <div><span>Basvuru erisimi</span><strong>{formatApplicationAccess(currentUser.applicationAccess)}</strong></div>
                    <div><span>Esik</span><strong>{currentUser.applicationAccess.minimumProfileCompletionPercent === null ? "Tanimli degil" : `%${currentUser.applicationAccess.minimumProfileCompletionPercent}`}</strong></div>
                    <div><span>Probe</span><strong>{formatProbeStatus(applicationProbeStatus, applicationProbeState)}</strong></div>
                    <div><span>Route</span><strong>{formatApplicationRouteStatus(applicationCreateStatus, applicationCreateState)}</strong></div>
                  </div>
                ) : (
                  <p>Login sonrasinda bu panelden korumali kullanici ozeti gorunur.</p>
                )}
              </div>
              <div className="message-preview">
                <div className="message-preview__header"><span>Basvuru demosu</span><strong>{currentApplication ? currentApplication.applicationId.slice(0, 8) : "Calismadi"}</strong></div>
                {currentApplication ? (
                  <div className="meta-list">
                    <div><span>Baslik</span><strong>{currentApplication.title ?? "Adsiz taslak"}</strong></div>
                    <div><span>Durum</span><strong>{currentApplication.status}</strong></div>
                    <div><span>Adim</span><strong>{formatApplicationStep(currentApplication.currentStep)}</strong></div>
                    <div><span>Entry mode</span><strong>{currentApplication.entryMode ?? "Yok"}</strong></div>
                    <div><span>Komiteler</span><strong>{applicationCommitteeCount ?? 0}</strong></div>
                    <div><span>Validation</span><strong>{applicationValidation ? (applicationValidation.isValid ? "Passed" : "Blocked") : "Bekliyor"}</strong></div>
                    <div><span>Checklist</span><strong>{applicationValidation?.items.length ?? 0}</strong></div>
                  </div>
                ) : (
                  <p>Policy gectikten sonra demo akisi create, intake, committee, form, document ve validate adimlarini arka arkaya calistirir.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
