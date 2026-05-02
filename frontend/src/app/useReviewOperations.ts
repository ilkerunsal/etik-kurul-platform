import { startTransition, type Dispatch, type SetStateAction } from "react";
import {
  addApplicationToCommitteeAgenda,
  assignApplicationExpert,
  assignDevelopmentRole,
  approveCommitteeReview,
  approveExpertReview,
  confirmCode,
  fetchApplication,
  fetchApplicationPackageQueue,
  fetchCommitteeAgendaQueue,
  fetchExpertAssignmentQueue,
  fetchMockMessages,
  fetchMyApplications,
  fetchMyExpertAssignments,
  getErrorMessage,
  loginUser,
  prepareApplicationPackage,
  registerUser,
  requestCommitteeRevision,
  requestExpertRevision,
  startExpertReview,
  submitApplicationRevisionResponse,
  submitCommitteeRevisionResponse,
  verifyIdentity,
} from "../api";
import type { ActivityEntry, ApplicationSummaryResponse } from "../types";
import type { BannerState, BusyAction } from "./demoState";
import { createRoleDemoRegisterForm, findLatestMessage } from "./formatters";
import { isReviewFlowStep } from "./reviewFlow";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface ReviewRoleSession {
  accessToken: string;
  email: string;
  userId: string;
}

interface UseReviewOperationsInput {
  currentApplication: ApplicationSummaryResponse | null;
  expertSession: ReviewRoleSession | null;
  secretariatSession: ReviewRoleSession | null;
  sessionToken: string;
  pushActivity: (message: string, tone: ActivityEntry["tone"]) => void;
  refreshSessionState: (accessToken: string) => Promise<void>;
  setAgendaQueueCount: StateSetter<number | null>;
  setAgendaState: StateSetter<string | null>;
  setAgendaStatus: StateSetter<number | null>;
  setBanner: StateSetter<BannerState | null>;
  setBusyAction: StateSetter<BusyAction | null>;
  setCommitteeDecisionState: StateSetter<string | null>;
  setCommitteeDecisionStatus: StateSetter<number | null>;
  setCommitteeRevisionResponseState: StateSetter<string | null>;
  setCommitteeRevisionResponseStatus: StateSetter<number | null>;
  setCommitteeRevisionState: StateSetter<string | null>;
  setCommitteeRevisionStatus: StateSetter<number | null>;
  setCurrentApplication: StateSetter<ApplicationSummaryResponse | null>;
  setExpertAssignmentState: StateSetter<string | null>;
  setExpertAssignmentStatus: StateSetter<number | null>;
  setExpertDecisionState: StateSetter<string | null>;
  setExpertDecisionStatus: StateSetter<number | null>;
  setExpertQueueCount: StateSetter<number | null>;
  setExpertReviewState: StateSetter<string | null>;
  setExpertReviewStatus: StateSetter<number | null>;
  setExpertSession: StateSetter<ReviewRoleSession | null>;
  setMyApplications: StateSetter<ApplicationSummaryResponse[]>;
  setPackageQueueCount: StateSetter<number | null>;
  setPackageState: StateSetter<string | null>;
  setPackageStatus: StateSetter<number | null>;
  setRevisionResponseState: StateSetter<string | null>;
  setRevisionResponseStatus: StateSetter<number | null>;
  setSecretariatSession: StateSetter<ReviewRoleSession | null>;
}

export function useReviewOperations({
  currentApplication,
  expertSession,
  secretariatSession,
  sessionToken,
  pushActivity,
  refreshSessionState,
  setAgendaQueueCount,
  setAgendaState,
  setAgendaStatus,
  setBanner,
  setBusyAction,
  setCommitteeDecisionState,
  setCommitteeDecisionStatus,
  setCommitteeRevisionResponseState,
  setCommitteeRevisionResponseStatus,
  setCommitteeRevisionState,
  setCommitteeRevisionStatus,
  setCurrentApplication,
  setExpertAssignmentState,
  setExpertAssignmentStatus,
  setExpertDecisionState,
  setExpertDecisionStatus,
  setExpertQueueCount,
  setExpertReviewState,
  setExpertReviewStatus,
  setExpertSession,
  setMyApplications,
  setPackageQueueCount,
  setPackageState,
  setPackageStatus,
  setRevisionResponseState,
  setRevisionResponseStatus,
  setSecretariatSession,
}: UseReviewOperationsInput) {
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

  function getReviewContext() {
    const applicationId = currentApplication?.applicationId;
    const applicationStep = currentApplication?.currentStep;

    if (!sessionToken) {
      setBanner({
        tone: "neutral",
        title: "Inceleme icin oturum gerekli",
        detail: "Uzman ve kurul inceleme akisi icin once aktif arastirmaci JWT oturumu gerekli.",
      });
      pushActivity("Kurul inceleme akisi oturum olmadigi icin baslatilmadi.", "neutral");
      return null;
    }

    if (!applicationId || !applicationStep) {
      setBanner({
        tone: "neutral",
        title: "Inceleme icin basvuru gerekli",
        detail: "Once basvuru akisi ile WaitingExpertAssignment adimina gelen bir basvuru olusturun.",
      });
      pushActivity("Kurul inceleme akisi secili basvuru olmadigi icin baslatilmadi.", "neutral");
      return null;
    }

    if (!isReviewFlowStep(applicationStep)) {
      setBanner({
        tone: "neutral",
        title: "Inceleme akisina hazir degil",
        detail: `Bu operasyon ${applicationStep} adimindaki basvuru icin calistirilmez.`,
      });
      pushActivity("Review operasyonu uygun olmayan adimda cagrildi.", "neutral");
      return null;
    }

    return { applicationId, applicationStep };
  }

  function requireSecretariatSession() {
    if (!secretariatSession) {
      setBanner({
        tone: "neutral",
        title: "Secretariat oturumu gerekli",
        detail: "Once review ekraninda mock secretariat ve ethics_expert rollerini hazirlayin.",
      });
      pushActivity("Review operasyonu secretariat oturumu olmadigi icin baslatilmadi.", "neutral");
      return null;
    }

    return secretariatSession;
  }

  function requireExpertSession() {
    if (!expertSession) {
      setBanner({
        tone: "neutral",
        title: "Uzman oturumu gerekli",
        detail: "Once review ekraninda mock ethics_expert rolunu hazirlayin.",
      });
      pushActivity("Review operasyonu uzman oturumu olmadigi icin baslatilmadi.", "neutral");
      return null;
    }

    return expertSession;
  }

  async function refreshCurrentApplicationSnapshot(applicationId: string, fallbackApplication?: ApplicationSummaryResponse) {
    const applications = await fetchMyApplications(sessionToken);
    const selectedApplication = fallbackApplication
      ?? applications.find((application) => application.applicationId === applicationId)
      ?? await fetchApplication(sessionToken, applicationId);

    startTransition(() => {
      setMyApplications(applications);
      setCurrentApplication(selectedApplication);
    });
  }

  async function handleProvisionReviewRoles() {
    setBusyAction("provision-review-roles");

    try {
      const [nextSecretariatSession, nextExpertSession] = await Promise.all([
        provisionRoleSession("secretariat", "Secretariat"),
        provisionRoleSession("ethics_expert", "Expert"),
      ]);

      startTransition(() => {
        setSecretariatSession(nextSecretariatSession);
        setExpertSession(nextExpertSession);
      });
      setBanner({
        tone: "success",
        title: "Review rolleri hazir",
        detail: `${nextSecretariatSession.email} ve ${nextExpertSession.email} mock oturumlari olusturuldu.`,
      });
      pushActivity("Secretariat ve ethics_expert demo oturumlari hazirlandi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Review rolleri hazirlanamadi", detail: getErrorMessage(error) });
      pushActivity("Review rolleri hazirlama akisi hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleFetchExpertQueue() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();

    if (!context || !secretariat) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const queue = await fetchExpertAssignmentQueue(secretariat.accessToken);
      const inQueue = queue.some((application) => application.applicationId === context.applicationId);

      setExpertQueueCount(queue.length);
      setBanner({
        tone: inQueue ? "success" : "neutral",
        title: "Uzman atama kuyrugu okundu",
        detail: inQueue ? "Secili basvuru atama kuyrugunda." : "Secili basvuru atama kuyrugunda gorunmedi.",
      });
      pushActivity("Secretariat uzman atama kuyrugunu okudu.", inQueue ? "success" : "neutral");
    } catch (error) {
      setBanner({ tone: "error", title: "Uzman kuyrugu okunamadi", detail: getErrorMessage(error) });
      pushActivity("Uzman atama kuyrugu hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAssignExpert() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();
    const expert = requireExpertSession();

    if (!context || !secretariat || !expert) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const queue = await fetchExpertAssignmentQueue(secretariat.accessToken);
      const queuedApplication = queue.find((application) => application.applicationId === context.applicationId);

      if (!queuedApplication) {
        throw new Error("Secretariat kuyrugunda secili basvuru bulunamadi.");
      }

      const assignment = await assignApplicationExpert(
        secretariat.accessToken,
        context.applicationId,
        expert.userId,
      );

      const expertAssignments = await fetchMyExpertAssignments(expert.accessToken);
      const myAssignment = expertAssignments.find((item) => item.applicationId === context.applicationId);

      if (!myAssignment) {
        throw new Error("Uzmanin atanan is listesinde secili basvuru bulunamadi.");
      }

      startTransition(() => {
        setExpertQueueCount(queue.length);
        setExpertAssignmentStatus(200);
        setExpertAssignmentState(assignment.application.currentStep);
        setCurrentApplication(assignment.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, assignment.application);
      setBanner({
        tone: "success",
        title: "Uzman atandi",
        detail: `${assignment.expertDisplayName} secili basvuruya atandi.`,
      });
      pushActivity("Secretariat uzman atamasini tamamladi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Uzman atanamadi", detail: getErrorMessage(error) });
      pushActivity("Uzman atama islemi hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleStartExpertReview() {
    const context = getReviewContext();
    const expert = requireExpertSession();

    if (!context || !expert) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const review = await startExpertReview(expert.accessToken, context.applicationId);

      startTransition(() => {
        setExpertReviewStatus(200);
        setExpertReviewState(review.application.currentStep);
        setCurrentApplication(review.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, review.application);
      setBanner({
        tone: "success",
        title: "Uzman incelemesi basladi",
        detail: "Atanan uzman basvuruyu incelemeye aldi.",
      });
      pushActivity("Uzman inceleme baslangici kaydedildi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Uzman incelemesi baslatilamadi", detail: getErrorMessage(error) });
      pushActivity("Uzman inceleme baslatma hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRequestExpertRevision() {
    const context = getReviewContext();
    const expert = requireExpertSession();

    if (!context || !expert) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const revisionRequest = await requestExpertRevision(
        expert.accessToken,
        context.applicationId,
        "UI uzman revizyon talebi.",
      );

      startTransition(() => {
        setExpertReviewStatus(200);
        setExpertReviewState(revisionRequest.application.currentStep);
        setCurrentApplication(revisionRequest.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, revisionRequest.application);
      setBanner({
        tone: "success",
        title: "Uzman revizyon istedi",
        detail: "Basvuru arastirmaci revizyon yanitini bekliyor.",
      });
      pushActivity("Uzman revizyon talebi kaydetti.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Uzman revizyonu istenemedi", detail: getErrorMessage(error) });
      pushActivity("Uzman revizyon talebi hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRespondExpertRevision() {
    const context = getReviewContext();

    if (!context) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const revisionResponse = await submitApplicationRevisionResponse(
        sessionToken,
        context.applicationId,
        "UI uzman revizyon yaniti.",
      );

      startTransition(() => {
        setRevisionResponseStatus(200);
        setRevisionResponseState(revisionResponse.application.currentStep);
        setCurrentApplication(revisionResponse.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, revisionResponse.application);
      setBanner({
        tone: "success",
        title: "Uzman revizyonu yanitlandi",
        detail: "Arastirmaci uzman revizyon talebine yanit verdi.",
      });
      pushActivity("Arastirmaci uzman revizyon yanitini gonderdi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Uzman revizyonu yanitlanamadi", detail: getErrorMessage(error) });
      pushActivity("Uzman revizyon yaniti hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleApproveExpertReview() {
    const context = getReviewContext();
    const expert = requireExpertSession();

    if (!context || !expert) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const decision = await approveExpertReview(
        expert.accessToken,
        context.applicationId,
        "UI uzman onayi.",
      );

      startTransition(() => {
        setExpertDecisionStatus(200);
        setExpertDecisionState(decision.application.currentStep);
        setCurrentApplication(decision.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, decision.application);
      setBanner({
        tone: "success",
        title: "Uzman onayi kaydedildi",
        detail: "Basvuru sekretarya paketleme kuyruguna tasindi.",
      });
      pushActivity("Uzman inceleme kararini Approved olarak kapatti.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Uzman onayi kaydedilemedi", detail: getErrorMessage(error) });
      pushActivity("Uzman onayi hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleFetchPackageQueue() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();

    if (!context || !secretariat) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const packageQueue = await fetchApplicationPackageQueue(secretariat.accessToken);
      const inQueue = packageQueue.some((application) => application.applicationId === context.applicationId);

      setPackageQueueCount(packageQueue.length);
      setBanner({
        tone: inQueue ? "success" : "neutral",
        title: "Paketleme kuyrugu okundu",
        detail: inQueue ? "Secili basvuru paketleme kuyrugunda." : "Secili basvuru paketleme kuyrugunda gorunmedi.",
      });
      pushActivity("Secretariat paketleme kuyrugunu okudu.", inQueue ? "success" : "neutral");
    } catch (error) {
      setBanner({ tone: "error", title: "Paket kuyrugu okunamadi", detail: getErrorMessage(error) });
      pushActivity("Paketleme kuyrugu hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePreparePackage() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();

    if (!context || !secretariat) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const reviewPackage = await prepareApplicationPackage(
        secretariat.accessToken,
        context.applicationId,
        "UI sekretarya paket notu.",
      );

      startTransition(() => {
        setPackageStatus(200);
        setPackageState(reviewPackage.application.currentStep);
        setCurrentApplication(reviewPackage.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, reviewPackage.application);
      setBanner({
        tone: "success",
        title: "Paket hazirlandi",
        detail: "Secretariat kurul gundemi icin review paketini hazirladi.",
      });
      pushActivity("Secretariat paket hazirlama islemini tamamladi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Paket hazirlanamadi", detail: getErrorMessage(error) });
      pushActivity("Paket hazirlama hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleFetchAgendaQueue() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();

    if (!context || !secretariat) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const agendaQueue = await fetchCommitteeAgendaQueue(secretariat.accessToken);
      const inQueue = agendaQueue.some((application) => application.applicationId === context.applicationId);

      setAgendaQueueCount(agendaQueue.length);
      setBanner({
        tone: inQueue ? "success" : "neutral",
        title: "Kurul gundemi kuyrugu okundu",
        detail: inQueue ? "Secili basvuru gundem kuyrugunda." : "Secili basvuru gundem kuyrugunda gorunmedi.",
      });
      pushActivity("Secretariat kurul gundemi kuyrugunu okudu.", inQueue ? "success" : "neutral");
    } catch (error) {
      setBanner({ tone: "error", title: "Gundem kuyrugu okunamadi", detail: getErrorMessage(error) });
      pushActivity("Kurul gundemi kuyrugu hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddAgenda() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();

    if (!context || !secretariat) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const agendaItem = await addApplicationToCommitteeAgenda(
        secretariat.accessToken,
        context.applicationId,
        "UI kurul gundemi notu.",
      );

      startTransition(() => {
        setAgendaStatus(200);
        setAgendaState(agendaItem.application.currentStep);
        setCurrentApplication(agendaItem.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, agendaItem.application);
      setBanner({
        tone: "success",
        title: "Kurul gundemine eklendi",
        detail: "Hazir paket kurul incelemesine alindi.",
      });
      pushActivity("Secretariat basvuruyu kurul gundemine ekledi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Gundeme eklenemedi", detail: getErrorMessage(error) });
      pushActivity("Kurul gundemine ekleme hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRequestCommitteeRevision() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();

    if (!context || !secretariat) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const committeeRevisionRequest = await requestCommitteeRevision(
        secretariat.accessToken,
        context.applicationId,
        "UI kurul revizyon talebi.",
      );

      startTransition(() => {
        setCommitteeRevisionStatus(200);
        setCommitteeRevisionState(committeeRevisionRequest.application.currentStep);
        setCurrentApplication(committeeRevisionRequest.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, committeeRevisionRequest.application);
      setBanner({
        tone: "success",
        title: "Kurul revizyon istedi",
        detail: "Basvuru arastirmaci kurul revizyon yanitini bekliyor.",
      });
      pushActivity("Kurul revizyon talebi kaydedildi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Kurul revizyonu istenemedi", detail: getErrorMessage(error) });
      pushActivity("Kurul revizyon talebi hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRespondCommitteeRevision() {
    const context = getReviewContext();

    if (!context) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const committeeRevisionResponse = await submitCommitteeRevisionResponse(
        sessionToken,
        context.applicationId,
        "UI kurul revizyon yaniti.",
      );

      startTransition(() => {
        setCommitteeRevisionResponseStatus(200);
        setCommitteeRevisionResponseState(committeeRevisionResponse.application.currentStep);
        setCurrentApplication(committeeRevisionResponse.application);
      });
      await refreshCurrentApplicationSnapshot(context.applicationId, committeeRevisionResponse.application);
      setBanner({
        tone: "success",
        title: "Kurul revizyonu yanitlandi",
        detail: "Arastirmaci kurul revizyon talebine yanit verdi.",
      });
      pushActivity("Arastirmaci kurul revizyon yanitini gonderdi.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Kurul revizyonu yanitlanamadi", detail: getErrorMessage(error) });
      pushActivity("Kurul revizyon yaniti hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleApproveCommitteeReview() {
    const context = getReviewContext();
    const secretariat = requireSecretariatSession();

    if (!context || !secretariat) {
      return;
    }

    setBusyAction("review-operation");

    try {
      const committeeDecision = await approveCommitteeReview(
        secretariat.accessToken,
        context.applicationId,
        "UI kurul onayi.",
      );

      startTransition(() => {
        setCommitteeDecisionStatus(200);
        setCommitteeDecisionState(committeeDecision.application.currentStep);
        setCurrentApplication(committeeDecision.application);
      });
      await Promise.all([
        refreshSessionState(sessionToken),
        refreshCurrentApplicationSnapshot(context.applicationId, committeeDecision.application),
      ]);
      setBanner({
        tone: "success",
        title: "Kurul karari kaydedildi",
        detail: `Kurul karari ${committeeDecision.decisionType} olarak kaydedildi.`,
      });
      pushActivity("Kurul kararini Approved olarak kaydetti.", "success");
    } catch (error) {
      setBanner({ tone: "error", title: "Kurul karari kaydedilemedi", detail: getErrorMessage(error) });
      pushActivity("Kurul karari hata verdi.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  return {
    handleAddAgenda,
    handleApproveCommitteeReview,
    handleApproveExpertReview,
    handleAssignExpert,
    handleFetchAgendaQueue,
    handleFetchExpertQueue,
    handleFetchPackageQueue,
    handlePreparePackage,
    handleProvisionReviewRoles,
    handleRequestCommitteeRevision,
    handleRequestExpertRevision,
    handleRespondCommitteeRevision,
    handleRespondExpertRevision,
    handleStartExpertReview,
  };
}
