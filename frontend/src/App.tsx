import { startTransition, useDeferredValue, useEffect, useState, type FormEvent } from "react";
import {
  addApplicationDocument,
  addApplicationToCommitteeAgenda,
  assignApplicationExpert,
  assignDevelopmentRole,
  approveCommitteeReview,
  approveExpertReview,
  confirmCode,
  createApplication,
  createProfile,
  fetchApplication,
  fetchApplicationPackageQueue,
  fetchCommitteeAgendaQueue,
  fetchExpertAssignmentQueue,
  fetchMyApplications,
  fetchMyExpertAssignments,
  fetchCommittees,
  fetchCurrentProfile,
  fetchCurrentUser,
  fetchMockMessages,
  getErrorMessage,
  isApiErrorStatus,
  loginUser,
  probeApplicationAccess,
  prepareApplicationPackage,
  registerUser,
  requestExpertRevision,
  requestCommitteeRevision,
  saveApplicationForm,
  saveApplicationIntake,
  sendCode,
  selectApplicationCommittee,
  setApplicationEntryMode,
  startExpertReview,
  submitApplicationRevisionResponse,
  submitCommitteeRevisionResponse,
  submitApplication,
  updateProfile,
  validateApplication,
  verifyIdentity,
} from "./api";
import type {
  AccountStatus,
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
  ActivityEntry,
  ContactChannelType,
  CurrentProfileResponse,
  SessionUserResponse,
} from "./types";
import {
  STORAGE_KEY,
  createDefaultSnapshot,
  emptyCodes,
  loadSnapshot,
  type BannerState,
  type BusyAction,
  type SnapshotState,
} from "./app/demoState";
import {
  createActivity,
  createRoleDemoRegisterForm,
  findLatestMessage,
  formatDate,
  mapProfileToForm,
} from "./app/formatters";
import { getInitialWorkflowView, type WorkflowStep, type WorkflowView } from "./app/workflow";
import { AuthGateway } from "./components/AuthGateway";
import { HeroPanel } from "./components/HeroPanel";
import { IdentityWorkflow } from "./components/workflows/IdentityWorkflow";
import { ProfileWorkflow } from "./components/workflows/ProfileWorkflow";
import { SessionWorkflow } from "./components/workflows/SessionWorkflow";
import { WorkflowOverview } from "./components/workflows/WorkflowOverview";

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
  const [applicationSubmitStatus, setApplicationSubmitStatus] = useState<number | null>(snapshot.applicationSubmitStatus);
  const [applicationSubmitState, setApplicationSubmitState] = useState<string | null>(snapshot.applicationSubmitState);
  const [expertQueueCount, setExpertQueueCount] = useState<number | null>(snapshot.expertQueueCount);
  const [expertAssignmentStatus, setExpertAssignmentStatus] = useState<number | null>(snapshot.expertAssignmentStatus);
  const [expertAssignmentState, setExpertAssignmentState] = useState<string | null>(snapshot.expertAssignmentState);
  const [expertReviewStatus, setExpertReviewStatus] = useState<number | null>(snapshot.expertReviewStatus);
  const [expertReviewState, setExpertReviewState] = useState<string | null>(snapshot.expertReviewState);
  const [revisionResponseStatus, setRevisionResponseStatus] = useState<number | null>(snapshot.revisionResponseStatus);
  const [revisionResponseState, setRevisionResponseState] = useState<string | null>(snapshot.revisionResponseState);
  const [expertDecisionStatus, setExpertDecisionStatus] = useState<number | null>(snapshot.expertDecisionStatus);
  const [expertDecisionState, setExpertDecisionState] = useState<string | null>(snapshot.expertDecisionState);
  const [packageQueueCount, setPackageQueueCount] = useState<number | null>(snapshot.packageQueueCount);
  const [packageStatus, setPackageStatus] = useState<number | null>(snapshot.packageStatus);
  const [packageState, setPackageState] = useState<string | null>(snapshot.packageState);
  const [agendaQueueCount, setAgendaQueueCount] = useState<number | null>(snapshot.agendaQueueCount);
  const [agendaStatus, setAgendaStatus] = useState<number | null>(snapshot.agendaStatus);
  const [agendaState, setAgendaState] = useState<string | null>(snapshot.agendaState);
  const [committeeRevisionStatus, setCommitteeRevisionStatus] = useState<number | null>(snapshot.committeeRevisionStatus);
  const [committeeRevisionState, setCommitteeRevisionState] = useState<string | null>(snapshot.committeeRevisionState);
  const [committeeRevisionResponseStatus, setCommitteeRevisionResponseStatus] = useState<number | null>(snapshot.committeeRevisionResponseStatus);
  const [committeeRevisionResponseState, setCommitteeRevisionResponseState] = useState<string | null>(snapshot.committeeRevisionResponseState);
  const [committeeDecisionStatus, setCommitteeDecisionStatus] = useState<number | null>(snapshot.committeeDecisionStatus);
  const [committeeDecisionState, setCommitteeDecisionState] = useState<string | null>(snapshot.committeeDecisionState);
  const [currentApplication, setCurrentApplication] = useState<ApplicationSummaryResponse | null>(null);
  const [myApplications, setMyApplications] = useState<ApplicationSummaryResponse[]>([]);
  const [applicationValidation, setApplicationValidation] = useState<ApplicationValidationResponse | null>(null);
  const [applicationCommitteeCount, setApplicationCommitteeCount] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);
  const [workflowView, setWorkflowView] = useState<WorkflowView>(() => getInitialWorkflowView(snapshot));

  const deferredActivity = useDeferredValue(activity);
  const latestEmailMessage = findLatestMessage(mockMessages, "email");
  const latestSmsMessage = findLatestMessage(mockMessages, "sms");
  const hasSession = !!sessionToken;
  const hasExistingProfile = !!currentProfileId;
  const canVerifyIdentity = !!userId && (accountStatus === "pending_identity_check" || accountStatus === "identity_failed");
  const canManageContacts = !!userId && (accountStatus === "contact_pending" || accountStatus === "active");
  const canCreateProfile = accountStatus === "active" && hasSession;
  const shouldShowAuthGateway = !hasSession && !userId;
  const identityDone = accountStatus === "active" || hasSession;
  const profileDone = (profileCompletionPercent ?? 0) >= 100;
  const applicationDone = !!currentApplication || applicationCreateStatus === 201;
  const reviewDone = currentApplication?.currentStep === "Approved" || committeeDecisionState === "Approved";
  const workflowSteps: WorkflowStep[] = [
    {
      id: "identity" as const,
      number: "01",
      title: "Kimlik ve iletisim",
      description: "Kayit, NVI, email ve SMS aktivasyonu.",
      enabled: !!userId || !!accountStatus,
      done: identityDone,
    },
    {
      id: "profile" as const,
      number: "02",
      title: "Profil ve yetki",
      description: "JWT oturumu, profil tamamlama ve policy probe.",
      enabled: identityDone,
      done: profileDone,
    },
    {
      id: "application" as const,
      number: "03",
      title: "Basvuru hazirligi",
      description: "Taslak, intake, komite, form, dokuman ve submit.",
      enabled: hasSession && profileDone,
      done: applicationDone,
    },
    {
      id: "review" as const,
      number: "04",
      title: "Inceleme ve kurul",
      description: "Uzman, sekreterya, gundem ve kurul karari.",
      enabled: hasSession && applicationDone,
      done: reviewDone,
    },
  ];
  const activeWorkflowStep = workflowSteps.find((step) => step.id === workflowView) ?? workflowSteps[0];

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
      applicationSubmitStatus,
      applicationSubmitState,
      expertQueueCount,
      expertAssignmentStatus,
      expertAssignmentState,
      expertReviewStatus,
      expertReviewState,
      revisionResponseStatus,
      revisionResponseState,
      expertDecisionStatus,
      expertDecisionState,
      packageQueueCount,
      packageStatus,
      packageState,
      agendaQueueCount,
      agendaStatus,
      agendaState,
      committeeRevisionStatus,
      committeeRevisionState,
      committeeRevisionResponseStatus,
      committeeRevisionResponseState,
      committeeDecisionStatus,
      committeeDecisionState,
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
    expertAssignmentState,
    expertAssignmentStatus,
    expertDecisionState,
    expertDecisionStatus,
    expertQueueCount,
    expertReviewState,
    expertReviewStatus,
    agendaQueueCount,
    agendaState,
    agendaStatus,
    committeeDecisionState,
    committeeDecisionStatus,
    committeeRevisionResponseState,
    committeeRevisionResponseStatus,
    committeeRevisionState,
    committeeRevisionStatus,
    packageQueueCount,
    packageState,
    packageStatus,
    revisionResponseState,
    revisionResponseStatus,
    applicationSubmitState,
    applicationSubmitStatus,
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

  async function loadApplications(accessToken: string, focusApplicationId?: string | null) {
    const applications = await fetchMyApplications(accessToken);
    let focusedApplication = applications[0] ?? null;

    if (focusApplicationId) {
      try {
        focusedApplication = await fetchApplication(accessToken, focusApplicationId);
      } catch (error) {
        if (!isApiErrorStatus(error, 404)) {
          throw error;
        }
      }
    }

    startTransition(() => {
      setMyApplications(applications);
      setCurrentApplication(focusedApplication);
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

        await Promise.all([
          refreshSessionState(sessionToken),
          loadApplications(sessionToken, currentApplication?.applicationId ?? null),
        ]);
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
      setApplicationSubmitStatus(null);
      setApplicationSubmitState(null);
      setExpertQueueCount(null);
      setExpertAssignmentStatus(null);
      setExpertAssignmentState(null);
      setExpertReviewStatus(null);
      setExpertReviewState(null);
      setRevisionResponseStatus(null);
      setRevisionResponseState(null);
      setExpertDecisionStatus(null);
      setExpertDecisionState(null);
      setCurrentApplication(null);
      setMyApplications([]);
      setApplicationValidation(null);
      setApplicationCommitteeCount(null);
      setSessionToken("");
      setSessionExpiresAt(null);
      setLoginIdentifier(registerForm.email || registerForm.phone);
      setLoginPassword(registerForm.password);
      setWorkflowView("identity");
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
        setWorkflowView("identity");
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
      if (response.accountStatus === "active") {
        setWorkflowView("profile");
      }
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
        if (response.profileCompletionPercent >= 100) {
          setWorkflowView("application");
        }
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
        if (response.profileCompletionPercent >= 100) {
          setWorkflowView("application");
        }
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
      await loadApplications(response.accessToken, currentApplication?.applicationId ?? null);
      setWorkflowView(response.user.applicationAccess.canOpenApplication ? "application" : "profile");
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
      await Promise.all([
        refreshSessionState(sessionToken),
        loadApplications(sessionToken, currentApplication?.applicationId ?? null),
      ]);
      setBanner({ tone: "neutral", title: "Oturum bilgisi yenilendi", detail: "Korumali /auth/me ve /profile/me endpointleri aktif session ile cevap verdi." });
      pushActivity("Session endpointleri basariyla okundu.", "neutral");
    } catch (error) {
      setBanner({ tone: "error", title: "Me sorgusu basarisiz", detail: getErrorMessage(error) });
      pushActivity("Me endpointi okunamadi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleFetchApplications() {
    if (!sessionToken) {
      return;
    }

    setBusyAction("fetch-applications");

    try {
      await loadApplications(sessionToken, currentApplication?.applicationId ?? null);
      setBanner({
        tone: "neutral",
        title: "Basvurular yenilendi",
        detail: "Kullaniciya ait basvuru listesi ve secili basvuru ozeti guncellendi.",
      });
      pushActivity("GET /applications ve GET /applications/{id} basariyla okundu.", "neutral");
    } catch (error) {
      setBanner({ tone: "error", title: "Basvuru listesi okunamadi", detail: getErrorMessage(error) });
      pushActivity("Basvuru listeleme istegi basarisiz oldu.", "error");
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

      await addApplicationDocument(
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
      const finalApplication = validationResponse.isValid
        ? await submitApplication(sessionToken, createdApplication.applicationId)
        : await fetchApplication(sessionToken, createdApplication.applicationId);
      const applications = await fetchMyApplications(sessionToken);

      startTransition(() => {
        setApplicationCommitteeCount(committees.length);
        setMyApplications(applications);
        setCurrentApplication(finalApplication);
        setApplicationValidation(validationResponse);
      });
      setApplicationCreateStatus(201);
      setApplicationCreateState(createdApplication.currentStep);
      setApplicationSubmitStatus(validationResponse.isValid ? 200 : 400);
      setApplicationSubmitState(finalApplication.currentStep);
      setWorkflowView(validationResponse.isValid ? "review" : "application");
      setBanner({
        tone: "success",
        title: "Basvuru akisi tamamlandi",
        detail: validationResponse.isValid
          ? "Taslak olusturuldu, sistem dogrulamasini gecti ve uzman kuyruguna gonderildi."
          : "Taslak olusturuldu fakat validation tabani bloklandi.",
      });
      pushActivity(
        validationResponse.isValid
          ? `Applications akisi create -> entry mode -> intake -> committee -> form -> document -> validate -> submit ile tamamlandi (${committeeSelection.currentStep}, form %${formResponse.completionPercent}).`
          : `Applications akisi create -> entry mode -> intake -> committee -> form -> document -> validate ile tamamlandi (${committeeSelection.currentStep}, form %${formResponse.completionPercent}).`,
        validationResponse.isValid ? "success" : "neutral",
      );
    } catch (error) {
      if (isApiErrorStatus(error, 403)) {
        setApplicationCreateStatus(403);
        setApplicationCreateState("blocked");
        setApplicationSubmitStatus(null);
        setApplicationSubmitState(null);
        setCurrentApplication(null);
        setMyApplications([]);
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

  async function provisionRoleSession(roleCode: "secretariat" | "ethics_expert", label: string) {
    const demoUser = createRoleDemoRegisterForm(label);
    const registerResponse = await registerUser(demoUser);
    await verifyIdentity(registerResponse.userId);

    const mockInbox = await fetchMockMessages(demoUser.email, demoUser.phone);
    const emailMessage = findLatestMessage(mockInbox, "email");

    if (!emailMessage?.code) {
      throw new Error(`${label} demo kullanicisi icin email dogrulama kodu bulunamadi.`);
    }

    await confirmCode(registerResponse.userId, "email", emailMessage.code);
    await assignDevelopmentRole(registerResponse.userId, roleCode);

    const loginResponse = await loginUser(demoUser.email, demoUser.password);
    return {
      email: demoUser.email,
      userId: registerResponse.userId,
      accessToken: loginResponse.accessToken,
    };
  }

  async function handleRunExpertWorkflow() {
    const applicationId = currentApplication?.applicationId;
    const applicationStep = currentApplication?.currentStep;

    if (!sessionToken || !applicationId || !applicationStep) {
      return;
    }

    if (applicationStep !== "WaitingExpertAssignment") {
      setBanner({
        tone: "neutral",
        title: "Uzman atama akisina hazir degil",
        detail: "Bu demo yalnizca WaitingExpertAssignment adimindaki basvurular icin calistirilir.",
      });
      pushActivity("Uzman atama demosu uygun olmayan adimda cagrildi.", "neutral");
      return;
    }

    setBusyAction("run-expert-flow");

    try {
      const secretariatSession = await provisionRoleSession("secretariat", "Secretariat");
      const expertSession = await provisionRoleSession("ethics_expert", "Expert");

      const queue = await fetchExpertAssignmentQueue(secretariatSession.accessToken);
      const queuedApplication = queue.find((application) => application.applicationId === applicationId);

      if (!queuedApplication) {
        throw new Error("Secretariat kuyrugunda secili basvuru bulunamadi.");
      }

      const assignment = await assignApplicationExpert(
        secretariatSession.accessToken,
        applicationId,
        expertSession.userId,
      );

      const expertAssignments = await fetchMyExpertAssignments(expertSession.accessToken);
      const myAssignment = expertAssignments.find((item) => item.applicationId === applicationId);

      if (!myAssignment) {
        throw new Error("Uzmanin atanan is listesinde secili basvuru bulunamadi.");
      }

      const review = await startExpertReview(expertSession.accessToken, applicationId);
      const revisionRequest = await requestExpertRevision(
        expertSession.accessToken,
        applicationId,
        "UI demo revizyon talebi.",
      );
      const revisionResponse = await submitApplicationRevisionResponse(
        sessionToken,
        applicationId,
        "UI demo revizyon yaniti.",
      );
      const decision = await approveExpertReview(
        expertSession.accessToken,
        applicationId,
        "UI demo uzman onayi.",
      );
      const packageQueue = await fetchApplicationPackageQueue(secretariatSession.accessToken);
      const packageQueuedApplication = packageQueue.find((application) => application.applicationId === applicationId);

      if (!packageQueuedApplication) {
        throw new Error("Paketleme kuyrugunda secili basvuru bulunamadi.");
      }

      const reviewPackage = await prepareApplicationPackage(
        secretariatSession.accessToken,
        applicationId,
        "UI demo sekretarya paket notu.",
      );
      const agendaQueue = await fetchCommitteeAgendaQueue(secretariatSession.accessToken);
      const agendaQueuedApplication = agendaQueue.find((application) => application.applicationId === applicationId);

      if (!agendaQueuedApplication) {
        throw new Error("Kurul gundemi kuyrugunda secili basvuru bulunamadi.");
      }

      const agendaItem = await addApplicationToCommitteeAgenda(
        secretariatSession.accessToken,
        applicationId,
        "UI demo kurul gundemi notu.",
      );
      const committeeRevisionRequest = await requestCommitteeRevision(
        secretariatSession.accessToken,
        applicationId,
        "UI demo kurul revizyon talebi.",
      );
      const committeeRevisionResponse = await submitCommitteeRevisionResponse(
        sessionToken,
        applicationId,
        "UI demo kurul revizyon yaniti.",
      );
      const committeeDecision = await approveCommitteeReview(
        secretariatSession.accessToken,
        applicationId,
        "UI demo kurul onayi.",
      );

      startTransition(() => {
        setExpertQueueCount(queue.length);
        setExpertAssignmentStatus(200);
        setExpertAssignmentState(assignment.application.currentStep);
        setExpertReviewStatus(200);
        setExpertReviewState(review.application.currentStep);
        setRevisionResponseStatus(200);
        setRevisionResponseState(revisionResponse.application.currentStep);
        setExpertDecisionStatus(200);
        setExpertDecisionState(decision.application.currentStep);
        setPackageQueueCount(packageQueue.length);
        setPackageStatus(200);
        setPackageState(reviewPackage.application.currentStep);
        setAgendaQueueCount(agendaQueue.length);
        setAgendaStatus(200);
        setAgendaState(agendaItem.application.currentStep);
        setCommitteeRevisionStatus(200);
        setCommitteeRevisionState(committeeRevisionRequest.application.currentStep);
        setCommitteeRevisionResponseStatus(200);
        setCommitteeRevisionResponseState(committeeRevisionResponse.application.currentStep);
        setCommitteeDecisionStatus(200);
        setCommitteeDecisionState(committeeDecision.application.currentStep);
      });

      await Promise.all([
        refreshSessionState(sessionToken),
        loadApplications(sessionToken, applicationId),
      ]);

      setBanner({
        tone: "success",
        title: "Uzman ve kurul gundemi demo akisi tamamlandi",
        detail: `${assignment.expertDisplayName} onayi sonrasi paket hazirlandi, kurul revizyonu yanitlandi ve karar ${committeeDecision.decisionType} olarak kaydedildi.`,
      });
      setWorkflowView("review");
      pushActivity(
        `Secretariat (${secretariatSession.email}) atama, paketleme ve kurul kararini isledi; expert (${expertSession.email}) ${revisionRequest.decisionType} istedi, arastirmaci iki revizyonu da yanitladi.`,
        "success",
      );
    } catch (error) {
      setBanner({ tone: "error", title: "Uzman ve kurul gundemi demo akisi basarisiz", detail: getErrorMessage(error) });
      pushActivity("Expert assignment / committee agenda akisi hata verdi.", "error");
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
    setApplicationSubmitStatus(null);
    setApplicationSubmitState(null);
    setExpertQueueCount(null);
    setExpertAssignmentStatus(null);
    setExpertAssignmentState(null);
    setExpertReviewStatus(null);
    setExpertReviewState(null);
    setRevisionResponseStatus(null);
    setRevisionResponseState(null);
    setExpertDecisionStatus(null);
    setExpertDecisionState(null);
    setPackageQueueCount(null);
    setPackageStatus(null);
    setPackageState(null);
    setAgendaQueueCount(null);
    setAgendaStatus(null);
    setAgendaState(null);
    setCommitteeRevisionStatus(null);
    setCommitteeRevisionState(null);
    setCommitteeRevisionResponseStatus(null);
    setCommitteeRevisionResponseState(null);
    setCommitteeDecisionStatus(null);
    setCommitteeDecisionState(null);
    setCurrentApplication(null);
    setMyApplications([]);
    setApplicationValidation(null);
    setApplicationCommitteeCount(null);
    setSessionToken("");
    setSessionExpiresAt(null);
    setCurrentUser(null);
    setWorkflowView(userId ? "profile" : "identity");
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
    setApplicationSubmitStatus(next.applicationSubmitStatus);
    setApplicationSubmitState(next.applicationSubmitState);
    setExpertQueueCount(next.expertQueueCount);
    setExpertAssignmentStatus(next.expertAssignmentStatus);
    setExpertAssignmentState(next.expertAssignmentState);
    setExpertReviewStatus(next.expertReviewStatus);
    setExpertReviewState(next.expertReviewState);
    setRevisionResponseStatus(next.revisionResponseStatus);
    setRevisionResponseState(next.revisionResponseState);
    setExpertDecisionStatus(next.expertDecisionStatus);
    setExpertDecisionState(next.expertDecisionState);
    setPackageQueueCount(next.packageQueueCount);
    setPackageStatus(next.packageStatus);
    setPackageState(next.packageState);
    setAgendaQueueCount(next.agendaQueueCount);
    setAgendaStatus(next.agendaStatus);
    setAgendaState(next.agendaState);
    setCommitteeRevisionStatus(next.committeeRevisionStatus);
    setCommitteeRevisionState(next.committeeRevisionState);
    setCommitteeRevisionResponseStatus(next.committeeRevisionResponseStatus);
    setCommitteeRevisionResponseState(next.committeeRevisionResponseState);
    setCommitteeDecisionStatus(next.committeeDecisionStatus);
    setCommitteeDecisionState(next.committeeDecisionState);
    setCurrentApplication(null);
    setMyApplications([]);
    setApplicationValidation(null);
    setApplicationCommitteeCount(null);
    setWorkflowView("identity");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  if (shouldShowAuthGateway) {
    return (
      <AuthGateway
        banner={banner}
        busyAction={busyAction}
        loginIdentifier={loginIdentifier}
        loginPassword={loginPassword}
        registerForm={registerForm}
        onLogin={handleLogin}
        onRegister={handleRegister}
        setLoginIdentifier={setLoginIdentifier}
        setLoginPassword={setLoginPassword}
        setRegisterForm={setRegisterForm}
      />
    );
  }

  return (
    <div className="app-shell">
      <HeroPanel
        accountStatus={accountStatus}
        activity={deferredActivity}
        applicationAccess={currentUser?.applicationAccess}
        emailVerified={emailVerified}
        hasSession={hasSession}
        phoneVerified={phoneVerified}
        profileCompletionPercent={profileCompletionPercent}
        userId={userId}
        onResetWorkflow={resetWorkflow}
      />
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
        <WorkflowOverview
          activeStep={activeWorkflowStep}
          steps={workflowSteps}
          workflowView={workflowView}
          onSelectWorkflow={setWorkflowView}
        />
        <div className="panel-grid">
          {workflowView === "identity" ? (
            <IdentityWorkflow
              busyAction={busyAction}
              canManageContacts={canManageContacts}
              canVerifyIdentity={canVerifyIdentity}
              codes={codes}
              emailVerified={emailVerified}
              identityResponseCode={identityResponseCode}
              latestEmailMessage={latestEmailMessage}
              latestSmsMessage={latestSmsMessage}
              phoneVerified={phoneVerified}
              registerForm={registerForm}
              userId={userId}
              onConfirmCode={(channelType) => void handleConfirmCode(channelType)}
              onRegister={handleRegister}
              onSendCode={(channelType) => void handleSendCode(channelType)}
              onVerifyIdentity={() => void handleVerifyIdentity()}
              setCodes={setCodes}
              setRegisterForm={setRegisterForm}
            />
          ) : null}
          {workflowView === "profile" ? (
            <ProfileWorkflow
              busyAction={busyAction}
              canCreateProfile={canCreateProfile}
              hasExistingProfile={hasExistingProfile}
              hasSession={hasSession}
              profileCompletionPercent={profileCompletionPercent}
              profileForm={profileForm}
              onCreateProfile={handleCreateProfile}
              setProfileForm={setProfileForm}
            />
          ) : null}
          {workflowView !== "identity" ? (
            <SessionWorkflow
              agendaQueueCount={agendaQueueCount}
              agendaState={agendaState}
              agendaStatus={agendaStatus}
              applicationCommitteeCount={applicationCommitteeCount}
              applicationCreateState={applicationCreateState}
              applicationCreateStatus={applicationCreateStatus}
              applicationProbeState={applicationProbeState}
              applicationProbeStatus={applicationProbeStatus}
              applicationSubmitState={applicationSubmitState}
              applicationSubmitStatus={applicationSubmitStatus}
              applicationValidation={applicationValidation}
              busyAction={busyAction}
              committeeDecisionState={committeeDecisionState}
              committeeDecisionStatus={committeeDecisionStatus}
              committeeRevisionResponseState={committeeRevisionResponseState}
              committeeRevisionResponseStatus={committeeRevisionResponseStatus}
              committeeRevisionState={committeeRevisionState}
              committeeRevisionStatus={committeeRevisionStatus}
              currentApplication={currentApplication}
              currentUser={currentUser}
              expertAssignmentState={expertAssignmentState}
              expertAssignmentStatus={expertAssignmentStatus}
              expertDecisionState={expertDecisionState}
              expertDecisionStatus={expertDecisionStatus}
              expertQueueCount={expertQueueCount}
              expertReviewState={expertReviewState}
              expertReviewStatus={expertReviewStatus}
              hasSession={hasSession}
              loginIdentifier={loginIdentifier}
              loginPassword={loginPassword}
              myApplications={myApplications}
              packageQueueCount={packageQueueCount}
              packageState={packageState}
              packageStatus={packageStatus}
              revisionResponseState={revisionResponseState}
              revisionResponseStatus={revisionResponseStatus}
              sessionExpiresAt={sessionExpiresAt}
              sessionToken={sessionToken}
              workflowView={workflowView}
              onCreateApplicationRoute={() => void handleCreateApplicationRoute()}
              onFetchApplications={() => void handleFetchApplications()}
              onFetchSession={() => void handleFetchSession()}
              onLogin={() => void handleLogin()}
              onLogout={handleLogout}
              onProbeApplicationAccess={() => void handleProbeApplicationAccess()}
              onRunExpertWorkflow={() => void handleRunExpertWorkflow()}
              setLoginIdentifier={setLoginIdentifier}
              setLoginPassword={setLoginPassword}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
