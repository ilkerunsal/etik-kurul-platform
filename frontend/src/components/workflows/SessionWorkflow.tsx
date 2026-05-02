import type { Dispatch, SetStateAction } from "react";
import {
  getApplicationReadiness,
  getApplicationStageCards,
  getApplicationStageProgress,
  getApplicationSummaryLabel,
  getApplicationValidationGuidance,
} from "../../app/applicationGuidance";
import {
  getReviewDecisionItems,
  getReviewProgress,
  getReviewReadiness,
  getReviewStageCards,
} from "../../app/reviewGuidance";
import {
  formatApplicationAccess,
  formatApplicationRouteStatus,
  formatApplicationStep,
  formatApplicationSubmitStatus,
  formatDate,
  formatExpertWorkflowStatus,
  formatProbeStatus,
  statusLabels,
  tokenPreview,
} from "../../app/formatters";
import type { WorkflowView } from "../../app/workflow";
import type { BusyAction } from "../../app/demoState";
import type {
  ApplicationFinalDossierResponse,
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
  SessionUserResponse,
} from "../../types";
import { ApplicationWorkspace } from "./ApplicationWorkspace";
import { ReviewWorkspace, type ReviewRoleSessionView } from "./ReviewWorkspace";

interface SessionWorkflowProps {
  agendaQueueCount: number | null;
  agendaState: string | null;
  agendaStatus: number | null;
  applicationCommitteeCount: number | null;
  applicationCreateState: string | null;
  applicationCreateStatus: number | null;
  applicationProbeState: string | null;
  applicationProbeStatus: number | null;
  applicationSubmitState: string | null;
  applicationSubmitStatus: number | null;
  applicationValidation: ApplicationValidationResponse | null;
  busyAction: BusyAction | null;
  committeeDecisionState: string | null;
  committeeDecisionStatus: number | null;
  committeeRevisionResponseState: string | null;
  committeeRevisionResponseStatus: number | null;
  committeeRevisionState: string | null;
  committeeRevisionStatus: number | null;
  currentApplication: ApplicationSummaryResponse | null;
  currentUser: SessionUserResponse | null;
  finalDossier: ApplicationFinalDossierResponse | null;
  expertAssignmentState: string | null;
  expertAssignmentStatus: number | null;
  expertSession: ReviewRoleSessionView | null;
  expertDecisionState: string | null;
  expertDecisionStatus: number | null;
  expertQueueCount: number | null;
  expertReviewState: string | null;
  expertReviewStatus: number | null;
  hasSession: boolean;
  loginIdentifier: string;
  loginPassword: string;
  myApplications: ApplicationSummaryResponse[];
  packageQueueCount: number | null;
  packageState: string | null;
  packageStatus: number | null;
  revisionResponseState: string | null;
  revisionResponseStatus: number | null;
  secretariatSession: ReviewRoleSessionView | null;
  sessionExpiresAt: string | null;
  sessionToken: string;
  workflowView: WorkflowView;
  onAddAgenda: () => void;
  onApproveCommittee: () => void;
  onApproveExpert: () => void;
  onAssignExpert: () => void;
  onCreateApplicationDraft: (title: string, summary: string) => void;
  onFetchAgendaQueue: () => void;
  onFetchApplications: () => void;
  onFetchFinalDossier: () => void;
  onFetchExpertQueue: () => void;
  onFetchPackageQueue: () => void;
  onFetchSession: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onPrepareApplicationSubmission: () => void;
  onPreparePackage: () => void;
  onProvisionReviewRoles: () => void;
  onProbeApplicationAccess: () => void;
  onRequestCommitteeRevision: () => void;
  onRequestExpertRevision: () => void;
  onRespondCommitteeRevision: () => void;
  onRespondExpertRevision: () => void;
  onSelectApplication: (applicationId: string) => void;
  onStartExpertReview: () => void;
  setLoginIdentifier: Dispatch<SetStateAction<string>>;
  setLoginPassword: Dispatch<SetStateAction<string>>;
}

function getSessionPanelCopy(workflowView: WorkflowView) {
  if (workflowView === "profile") {
    return {
      number: "05",
      title: "Oturum ve profil yetkisi",
      description: "Aktif hesapla login olun, profil bilgisini yukleyin ve CanOpenApplication policy durumunu kontrol edin.",
    };
  }

  if (workflowView === "application") {
    return {
      number: "03",
      title: "Basvuru hazirligi",
      description: "Profil esigi gecildikten sonra taslak, intake, komite, form, dokuman, validation ve submit adimlarini calistirin.",
    };
  }

  return {
    number: "04",
    title: "Inceleme ve kurul sureci",
    description: "Submit sonrasi uzman incelemesi, sekretarya dosya paketi, kurul gundemi, revizyon ve karar akisini calistirin.",
  };
}

export function SessionWorkflow({
  agendaQueueCount,
  agendaState,
  agendaStatus,
  applicationCommitteeCount,
  applicationCreateState,
  applicationCreateStatus,
  applicationProbeState,
  applicationProbeStatus,
  applicationSubmitState,
  applicationSubmitStatus,
  applicationValidation,
  busyAction,
  committeeDecisionState,
  committeeDecisionStatus,
  committeeRevisionResponseState,
  committeeRevisionResponseStatus,
  committeeRevisionState,
  committeeRevisionStatus,
  currentApplication,
  currentUser,
  finalDossier,
  expertAssignmentState,
  expertAssignmentStatus,
  expertSession,
  expertDecisionState,
  expertDecisionStatus,
  expertQueueCount,
  expertReviewState,
  expertReviewStatus,
  hasSession,
  loginIdentifier,
  loginPassword,
  myApplications,
  packageQueueCount,
  packageState,
  packageStatus,
  revisionResponseState,
  revisionResponseStatus,
  secretariatSession,
  sessionExpiresAt,
  sessionToken,
  workflowView,
  onAddAgenda,
  onApproveCommittee,
  onApproveExpert,
  onAssignExpert,
  onCreateApplicationDraft,
  onFetchAgendaQueue,
  onFetchApplications,
  onFetchFinalDossier,
  onFetchExpertQueue,
  onFetchPackageQueue,
  onFetchSession,
  onLogin,
  onLogout,
  onPrepareApplicationSubmission,
  onPreparePackage,
  onProvisionReviewRoles,
  onProbeApplicationAccess,
  onRequestCommitteeRevision,
  onRequestExpertRevision,
  onRespondCommitteeRevision,
  onRespondExpertRevision,
  onSelectApplication,
  onStartExpertReview,
  setLoginIdentifier,
  setLoginPassword,
}: SessionWorkflowProps) {
  const copy = getSessionPanelCopy(workflowView);
  const showLoginAction = workflowView === "profile" || !hasSession;
  const showApplicationActions = workflowView === "application" || workflowView === "review";
  const showPolicyProbeAction = workflowView === "profile" || workflowView === "application";
  const showApplicationCards = workflowView !== "profile";
  const showApplicationGuide = workflowView === "application";
  const applicationReadiness = getApplicationReadiness({ currentUser, hasSession });
  const applicationStageCards = getApplicationStageCards({
    applicationCommitteeCount,
    applicationCreateState,
    applicationCreateStatus,
    applicationSubmitState,
    applicationSubmitStatus,
    applicationValidation,
    currentApplication,
  });
  const applicationProgress = getApplicationStageProgress(applicationStageCards);
  const applicationValidationItems = getApplicationValidationGuidance(applicationValidation, applicationSubmitStatus);
  const applicationValidationPassed = applicationValidation?.isValid || applicationSubmitStatus === 200;
  const showReviewGuide = workflowView === "review";
  const reviewReadiness = getReviewReadiness({ currentApplication, hasSession });
  const reviewStageCards = getReviewStageCards({
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
  });
  const reviewProgress = getReviewProgress(reviewStageCards);
  const reviewDecisionItems = getReviewDecisionItems(reviewStageCards);

  return (
    <section className="panel panel--accent panel--wide">
      <div className="section-heading">
        <span>{copy.number}</span>
        <div>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="field"><span>Email veya telefon</span><input value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} /></label>
        <label className="field"><span>Sifre</span><input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>
      </div>
      {showApplicationGuide ? (
        <ApplicationWorkspace
          applicationValidation={applicationValidation}
          applicationValidationItems={applicationValidationItems}
          applicationValidationPassed={applicationValidationPassed}
          busyAction={busyAction}
          currentApplication={currentApplication}
          myApplications={myApplications}
          progress={applicationProgress}
          readiness={applicationReadiness}
          stageCards={applicationStageCards}
          onCreateDraft={onCreateApplicationDraft}
          onFetchApplications={onFetchApplications}
          onPrepareSubmission={onPrepareApplicationSubmission}
          onSelectApplication={onSelectApplication}
        />
      ) : null}
      {showReviewGuide ? (
        <ReviewWorkspace
          agendaQueueCount={agendaQueueCount}
          agendaStatus={agendaStatus}
          busyAction={busyAction}
          committeeDecisionStatus={committeeDecisionStatus}
          committeeRevisionResponseStatus={committeeRevisionResponseStatus}
          committeeRevisionStatus={committeeRevisionStatus}
          currentApplication={currentApplication}
          decisionItems={reviewDecisionItems}
          finalDossier={finalDossier}
          expertAssignmentStatus={expertAssignmentStatus}
          expertDecisionStatus={expertDecisionStatus}
          expertQueueCount={expertQueueCount}
          expertReviewStatus={expertReviewStatus}
          expertSession={expertSession}
          packageQueueCount={packageQueueCount}
          packageStatus={packageStatus}
          progress={reviewProgress}
          readiness={reviewReadiness}
          revisionResponseStatus={revisionResponseStatus}
          secretariatSession={secretariatSession}
          stageCards={reviewStageCards}
          onAddAgenda={onAddAgenda}
          onApproveCommittee={onApproveCommittee}
          onApproveExpert={onApproveExpert}
          onAssignExpert={onAssignExpert}
          onFetchAgendaQueue={onFetchAgendaQueue}
          onFetchFinalDossier={onFetchFinalDossier}
          onFetchExpertQueue={onFetchExpertQueue}
          onFetchPackageQueue={onFetchPackageQueue}
          onPreparePackage={onPreparePackage}
          onProvisionRoles={onProvisionReviewRoles}
          onRequestCommitteeRevision={onRequestCommitteeRevision}
          onRequestExpertRevision={onRequestExpertRevision}
          onRespondCommitteeRevision={onRespondCommitteeRevision}
          onRespondExpertRevision={onRespondExpertRevision}
          onStartExpertReview={onStartExpertReview}
        />
      ) : null}
      <div className="actions actions--cluster">
        {showLoginAction ? <button type="button" className="button" disabled={!loginIdentifier || !loginPassword || busyAction === "login"} onClick={onLogin}>{busyAction === "login" ? "Oturum aciliyor" : "Login ol"}</button> : null}
        <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "fetch-session"} onClick={onFetchSession}>{busyAction === "fetch-session" ? "Sorgulaniyor" : "Me bilgisini getir"}</button>
        {showApplicationActions ? <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "fetch-applications"} onClick={onFetchApplications}>{busyAction === "fetch-applications" ? "Listeleniyor" : "Basvurularimi getir"}</button> : null}
        {showPolicyProbeAction ? <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "probe-application"} onClick={onProbeApplicationAccess}>{busyAction === "probe-application" ? "Probe calisiyor" : "Policy probe"}</button> : null}
        <button type="button" className="button button--ghost" disabled={!hasSession} onClick={onLogout}>Oturumu temizle</button>
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

        {showApplicationCards ? (
          <div className="message-preview">
            <div className="message-preview__header"><span>Basvuru demosu</span><strong>{currentApplication ? currentApplication.applicationId.slice(0, 8) : "Calismadi"}</strong></div>
            {currentApplication ? (
              <div className="meta-list">
                <div><span>Baslik</span><strong>{currentApplication.title ?? "Adsiz taslak"}</strong></div>
                <div><span>Durum</span><strong>{getApplicationSummaryLabel(currentApplication)}</strong></div>
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
                <div><span>Dosya paketi kuyrugu</span><strong>{packageQueueCount ?? "Calismadi"}</strong></div>
                <div><span>Son inceleme paketi</span><strong>{formatExpertWorkflowStatus(packageStatus, packageState)}</strong></div>
                <div><span>Agenda</span><strong>{formatExpertWorkflowStatus(agendaStatus, agendaState)}</strong></div>
                <div><span>Committee revision</span><strong>{formatExpertWorkflowStatus(committeeRevisionStatus, committeeRevisionState)}</strong></div>
                <div><span>Committee response</span><strong>{formatExpertWorkflowStatus(committeeRevisionResponseStatus, committeeRevisionResponseState)}</strong></div>
                <div><span>Committee decision</span><strong>{formatExpertWorkflowStatus(committeeDecisionStatus, committeeDecisionState)}</strong></div>
                <div><span>Karar dosyasi</span><strong>{finalDossier?.dossierStatus ?? "Okunmadi"}</strong></div>
              </div>
            ) : (
              <p>Policy gectikten sonra demo akisi create, intake, committee, form, document, validate ve submit adimlarini; ardindan ayrik secretariat, expert ve arastirmaci oturumlariyla atama, review baslangici, revizyon yanitlari, uzman onayi, paketleme, kurul gundemi ve kurul onayini calistirir.</p>
            )}
          </div>
        ) : null}

        {showApplicationCards ? (
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
        ) : null}
      </div>
    </section>
  );
}
