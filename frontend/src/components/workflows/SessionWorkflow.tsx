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
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
  SessionUserResponse,
} from "../../types";
import { ValidationSummary } from "../ValidationSummary";

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
  expertAssignmentState: string | null;
  expertAssignmentStatus: number | null;
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
  sessionExpiresAt: string | null;
  sessionToken: string;
  workflowView: WorkflowView;
  onCreateApplicationRoute: () => void;
  onFetchApplications: () => void;
  onFetchSession: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onProbeApplicationAccess: () => void;
  onRunExpertWorkflow: () => void;
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
    description: "Submit sonrasi uzman, sekretarya, paket, gundem, revizyon ve kurul karari akisini calistirin.",
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
  expertAssignmentState,
  expertAssignmentStatus,
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
  sessionExpiresAt,
  sessionToken,
  workflowView,
  onCreateApplicationRoute,
  onFetchApplications,
  onFetchSession,
  onLogin,
  onLogout,
  onProbeApplicationAccess,
  onRunExpertWorkflow,
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
  const canRunApplicationDemo = applicationReadiness.ready;
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
  const canRunReviewDemo = reviewReadiness.ready;

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
        <div className="application-guidance">
          <div className="completion-card completion-card--application">
            <div className="completion-card__header">
              <div>
                <span className="eyebrow">Basvuru hazirligi</span>
                <strong>%{applicationReadiness.percent}</strong>
              </div>
              <small>
                {applicationReadiness.ready
                  ? "Basvuru demo akisi calistirilmaya hazir."
                  : `${applicationReadiness.completed}/${applicationReadiness.total} on kosul hazir.`}
              </small>
            </div>
            <div className="completion-meter" aria-label={`Basvuru on kosul hazirligi yuzde ${applicationReadiness.percent}`}>
              <span style={{ width: `${applicationReadiness.percent}%` }} />
            </div>
            <ValidationSummary
              items={applicationReadiness.missing}
              title="Basvuru on kosullari"
              tone={applicationReadiness.ready ? "success" : "neutral"}
              emptyMessage="JWT, aktif hesap, profil esigi ve CanOpenApplication hazir."
            />
          </div>

          <div className="application-stage-grid" aria-label="Basvuru demo adimlari">
            {applicationStageCards.map((card) => (
              <article className={`application-stage application-stage--${card.tone}`} key={card.number}>
                <span>{card.number}</span>
                <strong>{card.title}</strong>
                <p>{card.description}</p>
                <small>{card.status}</small>
              </article>
            ))}
          </div>

          <div className="application-demo-grid">
            <div className="message-preview message-preview--compact">
              <div className="message-preview__header">
                <span>Demo payload</span>
                <strong>{applicationProgress.completed}/{applicationProgress.total}</strong>
              </div>
              <div className="completion-meter" aria-label={`Basvuru demo adim ilerlemesi yuzde ${applicationProgress.percent}`}>
                <span style={{ width: `${applicationProgress.percent}%` }} />
              </div>
              <div className="meta-list">
                <div><span>Taslak</span><strong>Demo Basvurusu</strong></div>
                <div><span>Entry mode</span><strong>Guided</strong></div>
                <div><span>Intake</span><strong>clinical / 12 katilimci</strong></div>
                <div><span>Form</span><strong>clinical-main / %100</strong></div>
                <div><span>Dokuman</span><strong>consent.pdf</strong></div>
                <div><span>Submit hedefi</span><strong>WaitingExpertAssignment</strong></div>
              </div>
            </div>

            <div className="message-preview message-preview--compact">
              <div className="message-preview__header">
                <span>Validation checklist</span>
                <strong>{applicationValidationPassed ? "Passed" : applicationValidation ? "Blocked" : "Bekliyor"}</strong>
              </div>
              <ValidationSummary
                items={applicationValidationItems}
                title="Sistem dogrulamasi"
                tone={applicationValidationPassed ? "success" : applicationValidation ? "error" : "neutral"}
                emptyMessage="Checklist bos dondu; basvuru sistem dogrulamasindan gecti."
              />
            </div>
          </div>
        </div>
      ) : null}
      {showReviewGuide ? (
        <div className="application-guidance">
          <div className="completion-card completion-card--review">
            <div className="completion-card__header">
              <div>
                <span className="eyebrow">Kurul incelemesi</span>
                <strong>%{reviewReadiness.isComplete ? 100 : reviewReadiness.percent}</strong>
              </div>
              <small>
                {reviewReadiness.ready
                  ? "Uzman ve kurul demo akisi calistirilmaya hazir."
                  : reviewReadiness.isComplete
                    ? "Kurul karari tamamlandi."
                    : `${reviewReadiness.completed}/${reviewReadiness.total} on kosul hazir.`}
              </small>
            </div>
            <div
              className="completion-meter"
              aria-label={`Kurul inceleme on kosul hazirligi yuzde ${reviewReadiness.isComplete ? 100 : reviewReadiness.percent}`}
            >
              <span style={{ width: `${reviewReadiness.isComplete ? 100 : reviewReadiness.percent}%` }} />
            </div>
            <ValidationSummary
              items={reviewReadiness.missing}
              title="Inceleme on kosullari"
              tone={reviewReadiness.ready || reviewReadiness.isComplete ? "success" : "neutral"}
              emptyMessage="JWT ve WaitingExpertAssignment basvurusu hazir."
            />
          </div>

          <div className="application-stage-grid" aria-label="Uzman ve kurul demo adimlari">
            {reviewStageCards.map((card) => (
              <article className={`application-stage application-stage--${card.tone}`} key={card.number}>
                <span>{card.number}</span>
                <strong>{card.title}</strong>
                <p>{card.description}</p>
                <small>{card.status}</small>
              </article>
            ))}
          </div>

          <div className="application-demo-grid">
            <div className="message-preview message-preview--compact">
              <div className="message-preview__header">
                <span>Review payload</span>
                <strong>{reviewProgress.completed}/{reviewProgress.total}</strong>
              </div>
              <div className="completion-meter" aria-label={`Kurul demo adim ilerlemesi yuzde ${reviewProgress.percent}`}>
                <span style={{ width: `${reviewProgress.percent}%` }} />
              </div>
              <div className="meta-list">
                <div><span>Secretariat role</span><strong>secretariat</strong></div>
                <div><span>Expert role</span><strong>ethics_expert</strong></div>
                <div><span>Expert note</span><strong>Revizyon + onay</strong></div>
                <div><span>Researcher response</span><strong>Iki revizyon yaniti</strong></div>
                <div><span>Committee note</span><strong>Gundem + karar</strong></div>
                <div><span>Final decision</span><strong>{committeeDecisionStatus === 200 ? "Approved" : "Bekliyor"}</strong></div>
              </div>
            </div>

            <div className="message-preview message-preview--compact">
              <div className="message-preview__header">
                <span>Karar kontrol listesi</span>
                <strong>{reviewDecisionItems.length === 0 ? "Tamam" : "Bekliyor"}</strong>
              </div>
              <ValidationSummary
                items={reviewDecisionItems}
                title="Kurul karari"
                tone={reviewDecisionItems.length === 0 ? "success" : "neutral"}
                emptyMessage="Uzman ve kurul karar zinciri tamamlandi."
              />
            </div>
          </div>
        </div>
      ) : null}
      <div className="actions actions--cluster">
        {showLoginAction ? <button type="button" className="button" disabled={!loginIdentifier || !loginPassword || busyAction === "login"} onClick={onLogin}>{busyAction === "login" ? "Oturum aciliyor" : "Login ol"}</button> : null}
        <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "fetch-session"} onClick={onFetchSession}>{busyAction === "fetch-session" ? "Sorgulaniyor" : "Me bilgisini getir"}</button>
        {showApplicationActions ? <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "fetch-applications"} onClick={onFetchApplications}>{busyAction === "fetch-applications" ? "Listeleniyor" : "Basvurularimi getir"}</button> : null}
        {showPolicyProbeAction ? <button type="button" className="button button--ghost" disabled={!hasSession || busyAction === "probe-application"} onClick={onProbeApplicationAccess}>{busyAction === "probe-application" ? "Probe calisiyor" : "Policy probe"}</button> : null}
        {workflowView === "application" ? <button type="button" className="button button--ghost" disabled={!canRunApplicationDemo || busyAction === "create-application"} onClick={onCreateApplicationRoute}>{busyAction === "create-application" ? "Akis calisiyor" : "Basvuru demo akisi"}</button> : null}
        {workflowView === "review" ? <button type="button" className="button button--ghost" disabled={!canRunReviewDemo || busyAction === "run-expert-flow"} onClick={onRunExpertWorkflow}>{busyAction === "run-expert-flow" ? "Karar akisi calisiyor" : "Uzman + kurul demo akisi"}</button> : null}
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
