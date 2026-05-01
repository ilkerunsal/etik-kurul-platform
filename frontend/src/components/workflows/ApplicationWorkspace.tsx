import { useState } from "react";
import { getApplicationSummaryLabel, type ApplicationGuidanceCard } from "../../app/applicationGuidance";
import {
  formatApplicationStep,
  formatDate,
} from "../../app/formatters";
import type { BusyAction } from "../../app/demoState";
import type {
  ApplicationSummaryResponse,
  ApplicationValidationResponse,
} from "../../types";
import { ValidationSummary } from "../ValidationSummary";

interface ApplicationReadinessView {
  completed: number;
  missing: string[];
  percent: number;
  ready: boolean;
  total: number;
}

interface ApplicationProgressView {
  completed: number;
  percent: number;
  total: number;
}

interface ApplicationWorkspaceProps {
  applicationValidation: ApplicationValidationResponse | null;
  applicationValidationItems: string[];
  applicationValidationPassed: boolean;
  busyAction: BusyAction | null;
  currentApplication: ApplicationSummaryResponse | null;
  myApplications: ApplicationSummaryResponse[];
  progress: ApplicationProgressView;
  readiness: ApplicationReadinessView;
  stageCards: ApplicationGuidanceCard[];
  onCreateDraft: (title: string, summary: string) => void;
  onFetchApplications: () => void;
  onPrepareSubmission: () => void;
  onSelectApplication: (applicationId: string) => void;
}

function canPrepareApplication(application: ApplicationSummaryResponse | null) {
  if (!application) {
    return false;
  }

  return !["WaitingExpertAssignment", "Approved", "Rejected", "Withdrawn", "Closed"].includes(application.currentStep);
}

export function ApplicationWorkspace({
  applicationValidation,
  applicationValidationItems,
  applicationValidationPassed,
  busyAction,
  currentApplication,
  myApplications,
  progress,
  readiness,
  stageCards,
  onCreateDraft,
  onFetchApplications,
  onPrepareSubmission,
  onSelectApplication,
}: ApplicationWorkspaceProps) {
  const [draftTitle, setDraftTitle] = useState("Etik Kurul Basvurusu");
  const [draftSummary, setDraftSummary] = useState("Arastirma basvurusu icin kisa ozet.");
  const trimmedTitle = draftTitle.trim();
  const trimmedSummary = draftSummary.trim();
  const createDisabled = !readiness.ready || !trimmedTitle || !trimmedSummary || busyAction === "create-application";
  const prepareDisabled = !readiness.ready || !canPrepareApplication(currentApplication) || busyAction === "prepare-application";
  const selectedApplicationId = currentApplication?.applicationId ?? null;

  return (
    <div className="application-workspace">
      <div className="completion-card completion-card--application">
        <div className="completion-card__header">
          <div>
            <span className="eyebrow">Basvuru hazirligi</span>
            <strong>%{readiness.percent}</strong>
          </div>
          <small>
            {readiness.ready
              ? "Taslak olusturma ve submit operasyonlari hazir."
              : `${readiness.completed}/${readiness.total} on kosul hazir.`}
          </small>
        </div>
        <div className="completion-meter" aria-label={`Basvuru on kosul hazirligi yuzde ${readiness.percent}`}>
          <span style={{ width: `${readiness.percent}%` }} />
        </div>
        <ValidationSummary
          items={readiness.missing}
          title="Basvuru on kosullari"
          tone={readiness.ready ? "success" : "neutral"}
          emptyMessage="JWT, aktif hesap, profil esigi ve CanOpenApplication hazir."
        />
      </div>

      <div className="application-operation-grid">
        <section className="operation-card operation-card--draft">
          <div className="message-preview__header">
            <div>
              <span className="eyebrow">Taslak ekrani</span>
              <h4>Yeni basvuru olustur</h4>
            </div>
            <strong>POST /applications</strong>
          </div>
          <div className="form-grid">
            <label className="field field--full">
              <span>Baslik</span>
              <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
            </label>
            <label className="field field--full">
              <span>Ozet</span>
              <textarea value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} rows={4} />
            </label>
          </div>
          <div className="actions actions--cluster">
            <button
              type="button"
              className="button"
              disabled={createDisabled}
              onClick={() => onCreateDraft(trimmedTitle, trimmedSummary)}
            >
              {busyAction === "create-application" ? "Taslak olusturuluyor" : "Taslak olustur"}
            </button>
            <small>Bu adim yalnizca taslak kaydi acar; form ve submit ayri adimdir.</small>
          </div>
        </section>

        <section className="operation-card">
          <div className="message-preview__header">
            <div>
              <span className="eyebrow">Basvuru listesi</span>
              <h4>Basvurularim</h4>
            </div>
            <button
              type="button"
              className="button button--ghost"
              disabled={busyAction === "fetch-applications"}
              onClick={onFetchApplications}
            >
              {busyAction === "fetch-applications" ? "Yenileniyor" : "Listeyi yenile"}
            </button>
          </div>
          {myApplications.length > 0 ? (
            <div className="application-list-grid">
              {myApplications.slice(0, 6).map((application) => (
                <article
                  className={`application-list-card${application.applicationId === selectedApplicationId ? " application-list-card--active" : ""}`}
                  key={application.applicationId}
                >
                  <div>
                    <strong>{application.title ?? application.applicationId.slice(0, 8)}</strong>
                    <small>{getApplicationSummaryLabel(application)}</small>
                  </div>
                  <button
                    type="button"
                    className="button button--ghost"
                    disabled={busyAction === "select-application" || application.applicationId === selectedApplicationId}
                    onClick={() => onSelectApplication(application.applicationId)}
                  >
                    {application.applicationId === selectedApplicationId ? "Secili" : "Sec"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-note">Henuz basvuru yok. Once yeni taslak olusturun veya listeyi yenileyin.</p>
          )}
        </section>
      </div>

      <section className="operation-card operation-card--wide">
        <div className="message-preview__header">
          <div>
            <span className="eyebrow">Detay ve submit</span>
            <h4>Secili basvuru</h4>
          </div>
          <strong>{currentApplication ? currentApplication.applicationId.slice(0, 8) : "Secilmedi"}</strong>
        </div>
        {currentApplication ? (
          <div className="application-detail-grid">
            <div className="meta-list">
              <div><span>Baslik</span><strong>{currentApplication.title ?? "Adsiz taslak"}</strong></div>
              <div><span>Durum</span><strong>{currentApplication.status}</strong></div>
              <div><span>Adim</span><strong>{formatApplicationStep(currentApplication.currentStep)}</strong></div>
              <div><span>Entry mode</span><strong>{currentApplication.entryMode ?? "Yok"}</strong></div>
              <div><span>Komite</span><strong>{currentApplication.committeeId ? currentApplication.committeeId.slice(0, 8) : "Secilmedi"}</strong></div>
              <div><span>Submitted at</span><strong>{currentApplication.submittedAt ? formatDate(currentApplication.submittedAt) : "Henuz gonderilmedi"}</strong></div>
            </div>
            <div className="message-preview message-preview--compact">
              <div className="message-preview__header">
                <span>Hazirlik paketi</span>
                <strong>{progress.completed}/{progress.total}</strong>
              </div>
              <div className="completion-meter" aria-label={`Basvuru hazirlik ilerlemesi yuzde ${progress.percent}`}>
                <span style={{ width: `${progress.percent}%` }} />
              </div>
              <ValidationSummary
                items={applicationValidationItems}
                title="Sistem dogrulamasi"
                tone={applicationValidationPassed ? "success" : applicationValidation ? "error" : "neutral"}
                emptyMessage="Checklist bos dondu; basvuru sistem dogrulamasindan gecti."
              />
              <div className="actions actions--cluster">
                <button
                  type="button"
                  className="button"
                  disabled={prepareDisabled}
                  onClick={onPrepareSubmission}
                >
                  {busyAction === "prepare-application" ? "Hazirlaniyor" : "Hazirla ve submit et"}
                </button>
                <small>Intake, komite, form, dokuman, validation ve submit sirayla calisir.</small>
              </div>
            </div>
          </div>
        ) : (
          <p className="empty-note">Listeden bir basvuru secin veya yeni taslak olusturun.</p>
        )}
      </section>

      <div className="application-stage-grid" aria-label="Basvuru hazirlik adimlari">
        {stageCards.map((card) => (
          <article className={`application-stage application-stage--${card.tone}`} key={card.number}>
            <span>{card.number}</span>
            <strong>{card.title}</strong>
            <p>{card.description}</p>
            <small>{card.status}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
