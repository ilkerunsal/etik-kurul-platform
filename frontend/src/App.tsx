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
  formatApplicationAccess,
  formatApplicationRouteStatus,
  formatApplicationStep,
  formatApplicationSubmitStatus,
  formatDate,
  formatExpertWorkflowStatus,
  formatProbeStatus,
  mapProfileToForm,
  statusDescriptions,
  statusLabels,
  tokenPreview,
} from "./app/formatters";
import { ActivityFeed } from "./components/ActivityFeed";
import { MessagePreview } from "./components/MessagePreview";
import { StatusBadge } from "./components/StatusBadge";

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
      await loadApplications(response.accessToken, currentApplication?.applicationId ?? null);
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
              <label className="field"><span>Dogum tarihi</span><input required placeholder="1990-01-01" pattern="\d{4}-\d{2}-\d{2}" value={registerForm.birthDate} onChange={(event) => setRegisterForm((current) => ({ ...current, birthDate: event.target.value }))} /></label>
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
              <label className="field"><span>CV dokuman Id</span><input placeholder="00000000-0000-0000-0000-000000000000" pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" value={profileForm.cvDocumentId} onChange={(event) => setProfileForm((current) => ({ ...current, cvDocumentId: event.target.value }))} disabled={!canCreateProfile} /></label>
              <label className="field field--toggle"><span>E-imza mevcut</span><input type="checkbox" checked={profileForm.hasESignature} onChange={(event) => setProfileForm((current) => ({ ...current, hasESignature: event.target.checked }))} disabled={!canCreateProfile} /></label>
              <div className="actions field--full"><button type="submit" className="button" disabled={!canCreateProfile || busyAction === "create-profile" || busyAction === "update-profile"}>{busyAction === "create-profile" || busyAction === "update-profile" ? "Kaydediliyor" : hasExistingProfile ? "Profili guncelle" : "Profili olustur"}</button><small>{!hasSession ? "Profil kaydi icin once login olun." : hasExistingProfile ? `Mevcut profil yuklendi. Guncel oran: %${profileCompletionPercent ?? 0}` : profileCompletionPercent === null ? "Profil orani backend cevabindan doner." : `Guncel tamamlanma orani: %${profileCompletionPercent}`}</small></div>
            </form>
          </section>
          <section className="panel panel--accent panel--wide">
            <div className="section-heading"><span>05</span><div><h3>JWT oturum ve basvuru demosu</h3><p>Aktif hesapla login olun, access token alin ve policy gecerse gercek applications akis demo cagrilarini; submit sonrasi da secretariat, expert ve kurul gundemi akisini bu panelden calistirin.</p></div></div>
            <div className="form-grid">
              <label className="field"><span>Email veya telefon</span><input value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} /></label>
              <label className="field"><span>Sifre</span><input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>
            </div>
            <div className="actions actions--cluster">
              <button type="button" className="button" disabled={!loginIdentifier || !loginPassword || busyAction === "login"} onClick={() => void handleLogin()}>{busyAction === "login" ? "Oturum aciliyor" : "Login ol"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "fetch-session"} onClick={() => void handleFetchSession()}>{busyAction === "fetch-session" ? "Sorgulaniyor" : "Me bilgisini getir"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "fetch-applications"} onClick={() => void handleFetchApplications()}>{busyAction === "fetch-applications" ? "Listeleniyor" : "Basvurularimi getir"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "probe-application"} onClick={() => void handleProbeApplicationAccess()}>{busyAction === "probe-application" ? "Probe calisiyor" : "Policy probe"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "create-application"} onClick={() => void handleCreateApplicationRoute()}>{busyAction === "create-application" ? "Akis calisiyor" : "Basvuru demo akisi"}</button>
              <button type="button" className="button button--ghost" disabled={!hasSession || !currentApplication || busyAction === "run-expert-flow"} onClick={() => void handleRunExpertWorkflow()}>{busyAction === "run-expert-flow" ? "Karar akisi calisiyor" : "Uzman + kurul demo akisi"}</button>
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
                    <div><span>Create</span><strong>{formatApplicationRouteStatus(applicationCreateStatus, applicationCreateState)}</strong></div>
                    <div><span>Submit</span><strong>{formatApplicationSubmitStatus(applicationSubmitStatus, applicationSubmitState)}</strong></div>
                    <div><span>Queue</span><strong>{expertQueueCount ?? "Calismadi"}</strong></div>
                    <div><span>Assign</span><strong>{formatExpertWorkflowStatus(expertAssignmentStatus, expertAssignmentState)}</strong></div>
                    <div><span>Review</span><strong>{formatExpertWorkflowStatus(expertReviewStatus, expertReviewState)}</strong></div>
                    <div><span>Revision response</span><strong>{formatExpertWorkflowStatus(revisionResponseStatus, revisionResponseState)}</strong></div>
                    <div><span>Decision</span><strong>{formatExpertWorkflowStatus(expertDecisionStatus, expertDecisionState)}</strong></div>
                    <div><span>Package</span><strong>{formatExpertWorkflowStatus(packageStatus, packageState)}</strong></div>
                    <div><span>Agenda queue</span><strong>{agendaQueueCount ?? "Calismadi"}</strong></div>
                    <div><span>Agenda</span><strong>{formatExpertWorkflowStatus(agendaStatus, agendaState)}</strong></div>
                    <div><span>Committee revision</span><strong>{formatExpertWorkflowStatus(committeeRevisionStatus, committeeRevisionState)}</strong></div>
                    <div><span>Committee response</span><strong>{formatExpertWorkflowStatus(committeeRevisionResponseStatus, committeeRevisionResponseState)}</strong></div>
                    <div><span>Committee decision</span><strong>{formatExpertWorkflowStatus(committeeDecisionStatus, committeeDecisionState)}</strong></div>
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
                    <div><span>Submitted at</span><strong>{currentApplication.submittedAt ? formatDate(currentApplication.submittedAt) : "Henuz gonderilmedi"}</strong></div>
                    <div><span>Komiteler</span><strong>{applicationCommitteeCount ?? 0}</strong></div>
                    <div><span>Validation</span><strong>{applicationValidation ? (applicationValidation.isValid ? "Passed" : "Blocked") : "Bekliyor"}</strong></div>
                    <div><span>Checklist</span><strong>{applicationValidation?.items.length ?? 0}</strong></div>
                    <div><span>Expert assign</span><strong>{formatExpertWorkflowStatus(expertAssignmentStatus, expertAssignmentState)}</strong></div>
                    <div><span>Expert review</span><strong>{formatExpertWorkflowStatus(expertReviewStatus, expertReviewState)}</strong></div>
                    <div><span>Revision response</span><strong>{formatExpertWorkflowStatus(revisionResponseStatus, revisionResponseState)}</strong></div>
                    <div><span>Expert decision</span><strong>{formatExpertWorkflowStatus(expertDecisionStatus, expertDecisionState)}</strong></div>
                    <div><span>Package queue</span><strong>{packageQueueCount ?? "Calismadi"}</strong></div>
                    <div><span>Package</span><strong>{formatExpertWorkflowStatus(packageStatus, packageState)}</strong></div>
                    <div><span>Agenda</span><strong>{formatExpertWorkflowStatus(agendaStatus, agendaState)}</strong></div>
                    <div><span>Committee revision</span><strong>{formatExpertWorkflowStatus(committeeRevisionStatus, committeeRevisionState)}</strong></div>
                    <div><span>Committee response</span><strong>{formatExpertWorkflowStatus(committeeRevisionResponseStatus, committeeRevisionResponseState)}</strong></div>
                    <div><span>Committee decision</span><strong>{formatExpertWorkflowStatus(committeeDecisionStatus, committeeDecisionState)}</strong></div>
                  </div>
                ) : (
                  <p>Policy gectikten sonra demo akisi create, intake, committee, form, document, validate ve submit adimlarini; ardindan ayrik secretariat, expert ve arastirmaci oturumlariyla atama, review baslangici, revizyon yanitlari, uzman onayi, paketleme, kurul gundemi ve kurul onayini calistirir.</p>
                )}
              </div>
              <div className="message-preview">
                <div className="message-preview__header"><span>Basvurularim</span><strong>{myApplications.length}</strong></div>
                {myApplications.length > 0 ? (
                  <div className="meta-list">
                    {myApplications.slice(0, 4).map((application) => (
                      <div key={application.applicationId}>
                        <span>{application.title ?? application.applicationId.slice(0, 8)}</span>
                        <strong>{`${application.status} / ${formatApplicationStep(application.currentStep)}`}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Login sonrasi bu panel kullanicinin draft veya submit edilmis basvurularini listeler.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
