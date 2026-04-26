import { formatApplicationAccess, statusDescriptions, statusLabels } from "../app/formatters";
import type { AccountStatus, ActivityEntry, ApplicationAccessResponse } from "../types";
import { ActivityFeed } from "./ActivityFeed";
import { StatusBadge } from "./StatusBadge";

interface HeroPanelProps {
  accountStatus: AccountStatus | null;
  activity: ActivityEntry[];
  applicationAccess?: ApplicationAccessResponse;
  emailVerified: boolean;
  hasSession: boolean;
  phoneVerified: boolean;
  profileCompletionPercent: number | null;
  userId: string;
  onResetWorkflow: () => void;
}

export function HeroPanel({
  accountStatus,
  activity,
  applicationAccess,
  emailVerified,
  hasSession,
  phoneVerified,
  profileCompletionPercent,
  userId,
  onResetWorkflow,
}: HeroPanelProps) {
  return (
    <aside className="hero-column">
      <div className="hero-panel">
        <span className="eyebrow">Etik Kurul Basvuru Sistemi</span>
        <h1>Faz 1 durum merkezi</h1>
        <p className="hero-copy">
          Kayit, NVI kontrolu, iletisim onayi, profil tamamlama, JWT oturumu ve ilk basvuru taslagi akisini tek ekranda yonetin.
        </p>
        <div className="hero-metrics">
          <div><span>Durum</span><strong>{accountStatus ? statusLabels[accountStatus] : "Baslangic"}</strong></div>
          <div><span>Profil</span><strong>{profileCompletionPercent === null ? "Henus yok" : `%${profileCompletionPercent}`}</strong></div>
          <div><span>Kullanici</span><strong>{userId ? `${userId.slice(0, 8)}...` : "Olusmadi"}</strong></div>
          <div><span>Basvuru</span><strong>{formatApplicationAccess(applicationAccess)}</strong></div>
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
          <div className="section-heading">
            <span>Son olaylar</span>
            <button type="button" className="button button--ghost" onClick={onResetWorkflow}>Akisi sifirla</button>
          </div>
          <ActivityFeed activity={activity} />
        </div>
      </div>
    </aside>
  );
}
