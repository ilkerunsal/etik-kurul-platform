import type { BannerState, BusyAction } from "../app/demoState";
import type { AuthMode } from "../app/workflow";
import type { RegisterForm } from "../types";
import type { Dispatch, FormEvent, SetStateAction } from "react";

interface AuthGatewayProps {
  banner: BannerState | null;
  busyAction: BusyAction | null;
  loginIdentifier: string;
  loginPassword: string;
  mode: AuthMode;
  registerForm: RegisterForm;
  onLogin: () => Promise<void>;
  onModeChange: (mode: AuthMode) => void;
  onRegister: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setLoginIdentifier: Dispatch<SetStateAction<string>>;
  setLoginPassword: Dispatch<SetStateAction<string>>;
  setRegisterForm: Dispatch<SetStateAction<RegisterForm>>;
}

export function AuthGateway({
  banner,
  busyAction,
  loginIdentifier,
  loginPassword,
  mode,
  registerForm,
  onLogin,
  onModeChange,
  onRegister,
  setLoginIdentifier,
  setLoginPassword,
  setRegisterForm,
}: AuthGatewayProps) {
  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <span className="eyebrow">Etik Kurul Basvuru Sistemi</span>
        <h1>Basvuru surecine guvenli giris</h1>
        <p>
          Arastirmacilar once hesap olusturur, kimlik ve iletisim dogrulamasini tamamlar,
          ardindan profil esigi ile basvuru alanina gecis yapar.
        </p>
        <div className="auth-proof-grid">
          <div><span>Kimlik</span><strong>NVI adapter hazir</strong></div>
          <div><span>Veri</span><strong>TCKN ve dogum tarihi sifreli</strong></div>
          <div><span>Yetki</span><strong>Profil %100 olmadan basvuru yok</strong></div>
        </div>
      </section>

      <section className="auth-card" aria-label="Giris ve kayit">
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab auth-tab--active" : "auth-tab"}
            onClick={() => onModeChange("login")}
          >
            Giris yap
          </button>
          <button
            type="button"
            className={mode === "register" ? "auth-tab auth-tab--active" : "auth-tab"}
            onClick={() => onModeChange("register")}
          >
            Kayit ol
          </button>
        </div>

        {banner ? (
          <section className={`banner banner--${banner.tone}`}>
            <strong>{banner.title}</strong>
            <p>{banner.detail}</p>
          </section>
        ) : null}

        {mode === "login" ? (
          <form
            className="form-grid auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onLogin();
            }}
          >
            <div className="auth-card__heading field--full">
              <span className="eyebrow">Mevcut hesap</span>
              <h2>Panele devam et</h2>
              <p>Aktif hesabinla giris yap; profil ve basvuru durumun otomatik yuklenir.</p>
            </div>
            <label className="field field--full">
              <span>Email veya telefon</span>
              <input
                required
                value={loginIdentifier}
                onChange={(event) => setLoginIdentifier(event.target.value)}
              />
            </label>
            <label className="field field--full">
              <span>Sifre</span>
              <input
                required
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>
            <div className="actions field--full">
              <button
                type="submit"
                className="button"
                disabled={!loginIdentifier || !loginPassword || busyAction === "login"}
              >
                {busyAction === "login" ? "Oturum aciliyor" : "Giris yap"}
              </button>
              <small>JWT oturumu baslayinca dashboard acilir.</small>
            </div>
          </form>
        ) : (
          <form className="form-grid auth-form" onSubmit={onRegister}>
            <div className="auth-card__heading field--full">
              <span className="eyebrow">Yeni arastirmaci</span>
              <h2>Kayit baslat</h2>
              <p>Kayit sonrasi NVI, e-posta ve SMS dogrulama adimlarina yonlendirileceksin.</p>
            </div>
            <label className="field">
              <span>Ad</span>
              <input
                required
                value={registerForm.firstName}
                onChange={(event) => setRegisterForm((current) => ({ ...current, firstName: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Soyad</span>
              <input
                required
                value={registerForm.lastName}
                onChange={(event) => setRegisterForm((current) => ({ ...current, lastName: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>TCKN</span>
              <input
                required
                inputMode="numeric"
                pattern="\d{11}"
                value={registerForm.tckn}
                onChange={(event) => setRegisterForm((current) => ({ ...current, tckn: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Dogum tarihi</span>
              <input
                required
                placeholder="1990-01-01"
                pattern="\d{4}-\d{2}-\d{2}"
                value={registerForm.birthDate}
                onChange={(event) => setRegisterForm((current) => ({ ...current, birthDate: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                required
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Telefon</span>
              <input
                required
                value={registerForm.phone}
                onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="field field--full">
              <span>Sifre</span>
              <input
                required
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <div className="actions field--full">
              <button type="submit" className="button" disabled={busyAction === "register"}>
                {busyAction === "register" ? "Kaydediliyor" : "Kaydi olustur"}
              </button>
              <small>Varsayilan rol researcher olarak atanir.</small>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
