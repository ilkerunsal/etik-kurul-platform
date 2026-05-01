import type { ReviewGuidanceCard } from "../../app/reviewGuidance";
import type { BusyAction } from "../../app/demoState";
import { isReviewFlowStep } from "../../app/reviewFlow";
import type { ApplicationSummaryResponse } from "../../types";
import { ValidationSummary } from "../ValidationSummary";

export interface ReviewRoleSessionView {
  email: string;
  userId: string;
}

interface ReviewReadinessView {
  completed: number;
  isComplete: boolean;
  missing: string[];
  percent: number;
  ready: boolean;
  total: number;
}

interface ReviewProgressView {
  completed: number;
  percent: number;
  total: number;
}

interface ReviewWorkspaceProps {
  agendaQueueCount: number | null;
  agendaStatus: number | null;
  busyAction: BusyAction | null;
  committeeDecisionStatus: number | null;
  committeeRevisionResponseStatus: number | null;
  committeeRevisionStatus: number | null;
  currentApplication: ApplicationSummaryResponse | null;
  decisionItems: string[];
  expertAssignmentStatus: number | null;
  expertDecisionStatus: number | null;
  expertQueueCount: number | null;
  expertReviewStatus: number | null;
  expertSession: ReviewRoleSessionView | null;
  packageQueueCount: number | null;
  packageStatus: number | null;
  progress: ReviewProgressView;
  readiness: ReviewReadinessView;
  revisionResponseStatus: number | null;
  secretariatSession: ReviewRoleSessionView | null;
  stageCards: ReviewGuidanceCard[];
  onAddAgenda: () => void;
  onApproveCommittee: () => void;
  onApproveExpert: () => void;
  onAssignExpert: () => void;
  onFetchAgendaQueue: () => void;
  onFetchExpertQueue: () => void;
  onFetchPackageQueue: () => void;
  onPreparePackage: () => void;
  onProvisionRoles: () => void;
  onRequestCommitteeRevision: () => void;
  onRequestExpertRevision: () => void;
  onRespondCommitteeRevision: () => void;
  onRespondExpertRevision: () => void;
  onStartExpertReview: () => void;
}

function isBusy(busyAction: BusyAction | null) {
  return busyAction === "review-operation" || busyAction === "provision-review-roles";
}

function roleStatus(role: ReviewRoleSessionView | null) {
  return role ? role.email : "Hazir degil";
}

function applicationReadyForReview(application: ApplicationSummaryResponse | null) {
  return isReviewFlowStep(application?.currentStep);
}

export function ReviewWorkspace({
  agendaQueueCount,
  agendaStatus,
  busyAction,
  committeeDecisionStatus,
  committeeRevisionResponseStatus,
  committeeRevisionStatus,
  currentApplication,
  decisionItems,
  expertAssignmentStatus,
  expertDecisionStatus,
  expertQueueCount,
  expertReviewStatus,
  expertSession,
  packageQueueCount,
  packageStatus,
  progress,
  readiness,
  revisionResponseStatus,
  secretariatSession,
  stageCards,
  onAddAgenda,
  onApproveCommittee,
  onApproveExpert,
  onAssignExpert,
  onFetchAgendaQueue,
  onFetchExpertQueue,
  onFetchPackageQueue,
  onPreparePackage,
  onProvisionRoles,
  onRequestCommitteeRevision,
  onRequestExpertRevision,
  onRespondCommitteeRevision,
  onRespondExpertRevision,
  onStartExpertReview,
}: ReviewWorkspaceProps) {
  const busy = isBusy(busyAction);
  const rolesReady = !!secretariatSession && !!expertSession;
  const currentStep = currentApplication?.currentStep;
  const reviewReady = readiness.ready && applicationReadyForReview(currentApplication);
  const canUseSecretariat = reviewReady && !!secretariatSession && !busy;
  const canUseExpert = reviewReady && !!expertSession && !busy;
  const canAssignExpert = canUseSecretariat && !!expertSession && currentStep === "WaitingExpertAssignment" && expertQueueCount !== null && expertAssignmentStatus !== 200;
  const canStartExpertReview = canUseExpert && currentStep === "ExpertAssigned" && expertReviewStatus !== 200;
  const canRequestExpertRevision = canUseExpert && currentStep === "UnderExpertReview" && expertReviewStatus === 200 && revisionResponseStatus !== 200;
  const canRespondExpertRevision = reviewReady && currentStep === "ExpertRevisionRequested" && revisionResponseStatus !== 200 && !busy;
  const canApproveExpert = canUseExpert && currentStep === "UnderExpertReview" && revisionResponseStatus === 200 && expertDecisionStatus !== 200;
  const canFetchPackageQueue = canUseSecretariat && currentStep === "ExpertApproved";
  const canPreparePackage = canFetchPackageQueue && packageQueueCount !== null && packageStatus !== 200;
  const canFetchAgendaQueue = canUseSecretariat && currentStep === "PackageReady" && packageStatus === 200;
  const canAddAgenda = canFetchAgendaQueue && agendaQueueCount !== null && agendaStatus !== 200;
  const canCommitteeRevision = canUseSecretariat && currentStep === "UnderCommitteeReview" && agendaStatus === 200 && committeeRevisionStatus !== 200;
  const canCommitteeResponse = reviewReady && currentStep === "CommitteeRevisionRequested" && committeeRevisionStatus === 200 && committeeRevisionResponseStatus !== 200 && !busy;
  const canCommitteeApprove = canUseSecretariat && currentStep === "UnderCommitteeReview" && committeeRevisionResponseStatus === 200 && committeeDecisionStatus !== 200;

  return (
    <div className="review-workspace">
      <div className="completion-card completion-card--review">
        <div className="completion-card__header">
          <div>
            <span className="eyebrow">Kurul incelemesi</span>
            <strong>%{readiness.isComplete ? 100 : readiness.percent}</strong>
          </div>
          <small>
            {readiness.ready
              ? "Uzman ve kurul operasyonlari calistirilmaya hazir."
              : readiness.isComplete
                ? "Kurul karari tamamlandi."
                : `${readiness.completed}/${readiness.total} on kosul hazir.`}
          </small>
        </div>
        <div
          className="completion-meter"
          aria-label={`Kurul inceleme on kosul hazirligi yuzde ${readiness.isComplete ? 100 : readiness.percent}`}
        >
          <span style={{ width: `${readiness.isComplete ? 100 : readiness.percent}%` }} />
        </div>
        <ValidationSummary
          items={readiness.missing}
          title="Inceleme on kosullari"
          tone={readiness.ready || readiness.isComplete ? "success" : "neutral"}
          emptyMessage="JWT ve WaitingExpertAssignment basvurusu hazir."
        />
      </div>

      <div className="review-operation-grid">
        <section className="operation-card operation-card--review">
          <div className="message-preview__header">
            <div>
              <span className="eyebrow">Rol oturumlari</span>
              <h4>Sekretarya ve uzman</h4>
            </div>
            <strong>{rolesReady ? "Hazir" : "Eksik"}</strong>
          </div>
          <div className="meta-list">
            <div><span>Secretariat</span><strong>{roleStatus(secretariatSession)}</strong></div>
            <div><span>Ethics expert</span><strong>{roleStatus(expertSession)}</strong></div>
          </div>
          <div className="actions actions--cluster">
            <button
              type="button"
              className="button"
              disabled={busyAction === "provision-review-roles"}
              onClick={onProvisionRoles}
            >
              {busyAction === "provision-review-roles" ? "Roller hazirlaniyor" : "Rolleri hazirla"}
            </button>
            <small>Mock roller dev endpoint ile atanir; canli entegrasyon yok.</small>
          </div>
        </section>

        <section className="operation-card">
          <div className="message-preview__header">
            <div>
              <span className="eyebrow">Atama kuyrugu</span>
              <h4>Uzman atama</h4>
            </div>
            <strong>{expertQueueCount === null ? "Bekliyor" : `${expertQueueCount} kayit`}</strong>
          </div>
          <div className="actions actions--cluster">
            <button type="button" className="button button--ghost" disabled={!canUseSecretariat} onClick={onFetchExpertQueue}>
              Kuyrugu getir
            </button>
            <button type="button" className="button" disabled={!canAssignExpert} onClick={onAssignExpert}>
              Uzmana ata
            </button>
          </div>
        </section>
      </div>

      <div className="review-operation-grid">
        <section className="operation-card operation-card--wide">
          <div className="message-preview__header">
            <div>
              <span className="eyebrow">Uzman inceleme</span>
              <h4>Revizyon ve uzman karari</h4>
            </div>
            <strong>{progress.completed}/{progress.total}</strong>
          </div>
          <div className="review-action-rail">
            <button type="button" className="button button--ghost" disabled={!canStartExpertReview} onClick={onStartExpertReview}>Incelemeyi baslat</button>
            <button type="button" className="button button--ghost" disabled={!canRequestExpertRevision} onClick={onRequestExpertRevision}>Revizyon iste</button>
            <button type="button" className="button button--ghost" disabled={!canRespondExpertRevision} onClick={onRespondExpertRevision}>Arastirmaci yaniti</button>
            <button type="button" className="button" disabled={!canApproveExpert} onClick={onApproveExpert}>Uzman onayi</button>
          </div>
        </section>

        <section className="operation-card operation-card--wide">
          <div className="message-preview__header">
            <div>
              <span className="eyebrow">Sekretarya ve kurul</span>
              <h4>Paket, gundem ve karar</h4>
            </div>
            <strong>{committeeDecisionStatus === 200 ? "Approved" : "Bekliyor"}</strong>
          </div>
          <div className="review-action-rail">
            <button type="button" className="button button--ghost" disabled={!canFetchPackageQueue} onClick={onFetchPackageQueue}>Paket kuyrugu</button>
            <button type="button" className="button button--ghost" disabled={!canPreparePackage} onClick={onPreparePackage}>Paket hazirla</button>
            <button type="button" className="button button--ghost" disabled={!canFetchAgendaQueue} onClick={onFetchAgendaQueue}>Gundem kuyrugu</button>
            <button type="button" className="button button--ghost" disabled={!canAddAgenda} onClick={onAddAgenda}>Gundeme ekle</button>
            <button type="button" className="button button--ghost" disabled={!canCommitteeRevision} onClick={onRequestCommitteeRevision}>Kurul revizyonu iste</button>
            <button type="button" className="button button--ghost" disabled={!canCommitteeResponse} onClick={onRespondCommitteeRevision}>Kurul revizyon yaniti</button>
            <button type="button" className="button" disabled={!canCommitteeApprove} onClick={onApproveCommittee}>Kurul onayi</button>
          </div>
        </section>
      </div>

      <div className="application-stage-grid" aria-label="Uzman ve kurul adimlari">
        {stageCards.map((card) => (
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
            <strong>{progress.completed}/{progress.total}</strong>
          </div>
          <div className="completion-meter" aria-label={`Kurul adim ilerlemesi yuzde ${progress.percent}`}>
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        <div className="message-preview message-preview--compact">
          <div className="message-preview__header">
            <span>Karar kontrol listesi</span>
            <strong>{decisionItems.length === 0 ? "Tamam" : "Bekliyor"}</strong>
          </div>
          <ValidationSummary
            items={decisionItems}
            title="Kurul karari"
            tone={decisionItems.length === 0 ? "success" : "neutral"}
            emptyMessage="Uzman ve kurul karar zinciri tamamlandi."
          />
        </div>
      </div>
    </div>
  );
}
