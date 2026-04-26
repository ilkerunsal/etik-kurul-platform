import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BusyAction } from "../../app/demoState";
import type { ContactChannelType, MockMessageResponse, RegisterForm } from "../../types";
import { MessagePreview } from "../MessagePreview";

interface IdentityWorkflowProps {
  busyAction: BusyAction | null;
  canManageContacts: boolean;
  canVerifyIdentity: boolean;
  codes: Record<ContactChannelType, string>;
  emailVerified: boolean;
  identityResponseCode: string | null;
  latestEmailMessage?: MockMessageResponse;
  latestSmsMessage?: MockMessageResponse;
  phoneVerified: boolean;
  registerForm: RegisterForm;
  userId: string;
  onConfirmCode: (channelType: ContactChannelType) => void;
  onRegister: (event: FormEvent<HTMLFormElement>) => void;
  onSendCode: (channelType: ContactChannelType) => void;
  onVerifyIdentity: () => void;
  setCodes: Dispatch<SetStateAction<Record<ContactChannelType, string>>>;
  setRegisterForm: Dispatch<SetStateAction<RegisterForm>>;
}

export function IdentityWorkflow({
  busyAction,
  canManageContacts,
  canVerifyIdentity,
  codes,
  emailVerified,
  identityResponseCode,
  latestEmailMessage,
  latestSmsMessage,
  phoneVerified,
  registerForm,
  userId,
  onConfirmCode,
  onRegister,
  onSendCode,
  onVerifyIdentity,
  setCodes,
  setRegisterForm,
}: IdentityWorkflowProps) {
  return (
    <>
      <section className="panel panel--form">
        <div className="section-heading">
          <span>01</span>
          <div>
            <h3>Kayit formu</h3>
            <p>Kullanici ve sifre bilgilerini toplayip hesabin ilk kaydini olusturur.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={onRegister}>
          <label className="field"><span>Ad</span><input required value={registerForm.firstName} onChange={(event) => setRegisterForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
          <label className="field"><span>Soyad</span><input required value={registerForm.lastName} onChange={(event) => setRegisterForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
          <label className="field"><span>TCKN</span><input required pattern="\d{11}" inputMode="numeric" value={registerForm.tckn} onChange={(event) => setRegisterForm((current) => ({ ...current, tckn: event.target.value }))} /></label>
          <label className="field"><span>Dogum tarihi</span><input required placeholder="1990-01-01" pattern="\d{4}-\d{2}-\d{2}" value={registerForm.birthDate} onChange={(event) => setRegisterForm((current) => ({ ...current, birthDate: event.target.value }))} /></label>
          <label className="field"><span>Email</span><input required type="email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label className="field"><span>Telefon</span><input required value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} /></label>
          <label className="field field--full"><span>Sifre</span><input required type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} /></label>
          <div className="actions field--full">
            <button type="submit" className="button" disabled={busyAction === "register"}>{busyAction === "register" ? "Kaydediliyor" : "Kaydi olustur"}</button>
            <small>Basarili kayit sonrasi varsayilan researcher rolu atanir.</small>
          </div>
        </form>
      </section>

      <section className="panel panel--accent">
        <div className="section-heading">
          <span>02</span>
          <div>
            <h3>NVI dogrulama</h3>
            <p>Sifrelenmis TCKN ve dogum tarihi backend tarafinda cozulup mock provider ile eslestirilir.</p>
          </div>
        </div>
        <div className="identity-summary">
          <div><span>Kullanici Id</span><strong>{userId || "Kayit bekleniyor"}</strong></div>
          <div><span>Son provider kodu</span><strong>{identityResponseCode ?? "Calismadi"}</strong></div>
        </div>
        <button type="button" className="button" disabled={!canVerifyIdentity || busyAction === "verify-identity"} onClick={onVerifyIdentity}>
          {busyAction === "verify-identity" ? "Dogrulaniyor" : "Kimlik dogrulamayi baslat"}
        </button>
      </section>

      <section className="panel panel--wide">
        <div className="section-heading">
          <span>03</span>
          <div>
            <h3>Iletisim kodlari</h3>
            <p>Mock email ve SMS kutulari gelistirme amacli okunur. Kodlari tek tikla alana yerlestirebilirsiniz.</p>
          </div>
        </div>
        <div className="channel-grid">
          <div className="channel-card">
            <div className="channel-card__header">
              <div><h4>Email onayi</h4><span>{emailVerified ? "Onaylandi" : "Bekliyor"}</span></div>
              <button type="button" className="button button--ghost" disabled={!canManageContacts || busyAction === "send-email"} onClick={() => onSendCode("email")}>
                {busyAction === "send-email" ? "Gonderiliyor" : "Yeni email kodu"}
              </button>
            </div>
            <MessagePreview channelType="email" message={latestEmailMessage} onUseCode={(channelType, code) => setCodes((current) => ({ ...current, [channelType]: code }))} />
            <div className="inline-form">
              <input placeholder="Email kodu" value={codes.email} onChange={(event) => setCodes((current) => ({ ...current, email: event.target.value }))} />
              <button type="button" className="button" disabled={!canManageContacts || !codes.email || busyAction === "confirm-email"} onClick={() => onConfirmCode("email")}>
                {busyAction === "confirm-email" ? "Onaylaniyor" : "Email kodunu onayla"}
              </button>
            </div>
          </div>

          <div className="channel-card">
            <div className="channel-card__header">
              <div><h4>SMS onayi</h4><span>{phoneVerified ? "Onaylandi" : "Bekliyor"}</span></div>
              <button type="button" className="button button--ghost" disabled={!canManageContacts || busyAction === "send-sms"} onClick={() => onSendCode("sms")}>
                {busyAction === "send-sms" ? "Gonderiliyor" : "Yeni SMS kodu"}
              </button>
            </div>
            <MessagePreview channelType="sms" message={latestSmsMessage} onUseCode={(channelType, code) => setCodes((current) => ({ ...current, [channelType]: code }))} />
            <div className="inline-form">
              <input placeholder="SMS kodu" value={codes.sms} onChange={(event) => setCodes((current) => ({ ...current, sms: event.target.value }))} />
              <button type="button" className="button" disabled={!canManageContacts || !codes.sms || busyAction === "confirm-sms"} onClick={() => onConfirmCode("sms")}>
                {busyAction === "confirm-sms" ? "Onaylaniyor" : "SMS kodunu onayla"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
