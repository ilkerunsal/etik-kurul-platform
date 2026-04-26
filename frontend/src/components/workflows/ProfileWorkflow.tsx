import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BusyAction } from "../../app/demoState";
import type { ProfileForm } from "../../types";

interface ProfileWorkflowProps {
  busyAction: BusyAction | null;
  canCreateProfile: boolean;
  hasExistingProfile: boolean;
  hasSession: boolean;
  profileCompletionPercent: number | null;
  profileForm: ProfileForm;
  onCreateProfile: (event: FormEvent<HTMLFormElement>) => void;
  setProfileForm: Dispatch<SetStateAction<ProfileForm>>;
}

export function ProfileWorkflow({
  busyAction,
  canCreateProfile,
  hasExistingProfile,
  hasSession,
  profileCompletionPercent,
  profileForm,
  onCreateProfile,
  setProfileForm,
}: ProfileWorkflowProps) {
  return (
    <section className="panel panel--form panel--wide">
      <div className="section-heading">
        <span>04</span>
        <div>
          <h3>Profil olusturma</h3>
          <p>E-imza ve KEP dahil Faz 1 profil alanlarini doldurur. Aktif JWT oturumu varsa mevcut profil otomatik yuklenir ve ayni formdan guncellenebilir.</p>
        </div>
      </div>
      <form className="form-grid" onSubmit={onCreateProfile}>
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
        <div className="actions field--full">
          <button type="submit" className="button" disabled={!canCreateProfile || busyAction === "create-profile" || busyAction === "update-profile"}>
            {busyAction === "create-profile" || busyAction === "update-profile" ? "Kaydediliyor" : hasExistingProfile ? "Profili guncelle" : "Profili olustur"}
          </button>
          <small>
            {!hasSession
              ? "Profil kaydi icin once login olun."
              : hasExistingProfile
                ? `Mevcut profil yuklendi. Guncel oran: %${profileCompletionPercent ?? 0}`
                : profileCompletionPercent === null
                  ? "Profil orani backend cevabindan doner."
                  : `Guncel tamamlanma orani: %${profileCompletionPercent}`}
          </small>
        </div>
      </form>
    </section>
  );
}
