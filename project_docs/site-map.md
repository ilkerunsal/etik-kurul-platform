# Site Map

Bu dokuman mevcut React istemcisinin ekran ve panel haritasini tanimlar.

## Genel Harita

```mermaid
flowchart TD
    A["Auth Gateway"] --> B["Login Form"]
    A --> C["Register Form"]
    C --> D["Identity & Verification Workspace"]
    B --> E["Authenticated Workspace"]
    D --> F["NVI Verification Panel"]
    D --> G["Contact Code Panel"]
    E --> H["Profile Panel"]
    E --> I["Session & Application Demo Panel"]
    I --> J["Application Preparation Flow"]
    I --> K["Expert + Committee Flow"]
```

## Ekranlar

| Ekran | URL | Gorunurluk | Amac |
| --- | --- | --- | --- |
| Auth Gateway | `/` | `sessionToken` ve `userId` yoksa | Ilk acilista giris veya kayit secimi |
| Identity & Verification Workspace | `/` | Kayit sonrasi `userId` varsa | NVI, email ve SMS dogrulama adimlari |
| Authenticated Workspace | `/` | JWT oturumu varsa | Profil, policy probe, basvuru demo ve inceleme akislari |

Not: Uygulama su an tek sayfa uygulama seklindedir. Ayrik route yapisi henuz eklenmedi.

## Auth Gateway

| Bolum | Alanlar | Islem |
| --- | --- | --- |
| Giris yap | Email veya telefon, sifre | `POST /auth/login` |
| Kayit ol | Ad, soyad, TCKN, dogum tarihi, email, telefon, sifre | `POST /auth/register` |
| Guven sinyalleri | Kimlik, veri, yetki kutulari | Kullaniciya sistem kurallarini anlatir |

Kayit basarili olunca kullanici ayni sayfada workspace ekranina tasinir ve NVI paneli aktif olur. Login basarili olunca JWT oturumu olusturulur ve authenticated workspace acilir.

## Workspace Layout

| Alan | Aciklama |
| --- | --- |
| Sol durum paneli | Hesap durumu, profil orani, kullanici id, basvuru erisimi, email/SMS/JWT durumlari |
| Son olaylar | UI tarafindaki son 12 islem kaydi |
| Ust aksiyon | Mock mesaj kutularini yenileme |
| Ana panel grid | Kayit, NVI, iletisim kodlari, profil ve basvuru demo panelleri |

## Panel Haritasi

| Panel | Baslik | Ana Butonlar | Durum Kosulu |
| --- | --- | --- | --- |
| 01 | Kayit formu | Kaydi olustur | Her zaman gorunur, Auth Gateway disinda demo/operasyon panelinde de kalir |
| 02 | NVI dogrulama | Kimlik dogrulamayi baslat | `pending_identity_check` veya `identity_failed` |
| 03 | Iletisim kodlari | Yeni email kodu, Email kodunu onayla, Yeni SMS kodu, SMS kodunu onayla | `contact_pending` veya `active` |
| 04 | Profil olusturma | Profili olustur, Profili guncelle | `active` ve JWT oturumu gerekli |
| 05 | JWT oturum ve basvuru demosu | Login ol, Me bilgisini getir, Basvurularimi getir, Policy probe, Basvuru demo akisi, Uzman + kurul demo akisi | Login alanlari her zaman gorunur; korumali butonlar JWT ister |

## Kullaniciye Gore Beklenen Giris Noktasi

| Kullanici tipi | Baslangic | Sonraki ekran |
| --- | --- | --- |
| Yeni arastirmaci | Auth Gateway > Kayit ol | NVI dogrulama paneli |
| Aktif arastirmaci | Auth Gateway > Giris yap | Profil ve basvuru paneli |
| Sekreterya demo kullanicisi | Dev role provisioning ile olusturulur | UI demo akisi icinde arka planda kullanilir |
| Etik uzman demo kullanicisi | Dev role provisioning ile olusturulur | UI demo akisi icinde arka planda kullanilir |

## UI Durum Kurallari

| Durum | UI etkisi |
| --- | --- |
| `pending_identity_check` | NVI butonu aktif olur |
| `identity_failed` | NVI tekrar denenebilir |
| `contact_pending` | Email/SMS kod panelleri aktif olur |
| `active` | Login ve profil sureci kullanilabilir |
| Profil `< %100` veya profil yok | Basvuru policy probe 403/blocked doner |
| Profil `%100` | Basvuru demo akisi calisabilir |

