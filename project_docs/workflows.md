# Workflows

Bu dokuman mevcut uygulamadaki ana is akisi ve durum gecislerini tanimlar.

## 1. Kayit ve Hesap Aktivasyonu

```mermaid
sequenceDiagram
    actor U as Kullanici
    participant UI as React UI
    participant API as Auth API
    participant DB as PostgreSQL
    participant NVI as Mock NVI Adapter
    participant MSG as Mock Email/SMS Adapters

    U->>UI: Kayit formunu doldurur
    UI->>API: POST /auth/register
    API->>DB: users + user_roles kaydi
    DB-->>API: pending_identity_check
    API-->>UI: userId, accountStatus
    UI-->>U: NVI panelini acar
    U->>UI: Kimlik dogrulamayi baslatir
    UI->>API: POST /auth/verify-identity
    API->>NVI: Sifreli TCKN/dogum tarihi cozulup mock kontrol yapilir
    API->>DB: user_identity_checks kaydi
    API->>MSG: Email ve SMS kodlari gonderilir
    API-->>UI: contact_pending
    U->>UI: Kodlari onaylar
    UI->>API: POST /auth/confirm-code
    API->>DB: email_verified / phone_verified
    API-->>UI: active
```

### Hesap durumlari

| Baslangic | Islem | Son durum |
| --- | --- | --- |
| Yok | Register | `pending_identity_check` |
| `pending_identity_check` | NVI basarili | `contact_pending` |
| `pending_identity_check` | NVI basarisiz | `identity_failed` |
| `identity_failed` | NVI tekrar basarili | `contact_pending` |
| `contact_pending` | Email veya SMS kodu dogrulandi | `active` |

Not: Mevcut implementasyonda email veya SMS kanallarindan birinin dogrulanmasi hesabi `active` yapar.

## 2. Login ve Session

```mermaid
flowchart TD
    A["/login"] --> B["POST /auth/login"]
    B --> C{"Credentials dogru mu?"}
    C -->|Hayir| D["Login basarisiz banner"]
    C -->|Evet| E["JWT access token"]
    E --> F["GET /auth/me"]
    E --> G["GET /profile/me"]
    E --> H["GET /applications"]
    F --> I["Authenticated workspace route"]
    G --> I
    H --> I
    I --> J{Profil esigi uygun mu?}
    J -->|Hayir| K["/workspace/profile"]
    J -->|Evet| L["/workspace/application"]
```

## 3. Profil ve Basvuru Yetki Kapisi

```mermaid
flowchart TD
    A["/workspace/profile"] --> B["POST /profile"]
    B --> C["profile_completion_percent hesaplanir"]
    C --> D{"Tamamlama %100 mu?"}
    D -->|Hayir| E["CanOpenApplication blocked"]
    D -->|Evet| F["/workspace/application"]
    F --> G["POST /applications"]
```

### Profil alanlari

| Alan | Not |
| --- | --- |
| Academic title | Opsiyonel fakat completion hesabina girer |
| Degree level | Opsiyonel fakat completion hesabina girer |
| Institution, faculty, department | Kurumsal profil alanlari |
| Position title | Gorev/pozisyon |
| Biography | Metinsel profil bilgisi |
| Specialization summary | Uzmanlik ozeti |
| Has e-signature | E-imza var/yok bilgisi |
| KEP address | KEP adresi |
| CV document id | Nullable Guid, dokuman modulu bu fazda yok |

## 4. Basvuru Hazirlama ve Submit

```mermaid
flowchart TD
    A["/workspace/application"] --> B["Create application"]
    B --> C["Set entry mode"]
    C --> D["Save intake"]
    D --> E["Select committee"]
    E --> F["Save form"]
    F --> G["Add document metadata"]
    G --> H["Validate application"]
    H --> I{"Validation passed?"}
    I -->|Hayir| J["ValidationFailed"]
    I -->|Evet| K["Submit application"]
    K --> L["/workspace/review"]
```

### Basvuru durum gecisleri

| Islem | Current step |
| --- | --- |
| Create | `Draft` |
| Intake kaydi | `IntakeInProgress` |
| Committee secimi | `CommitteeSelected` |
| Form kaydi | `ApplicationInPreparation` |
| Validation basarili | `ValidationPassed` |
| Submit | `WaitingExpertAssignment` |

## 5. Uzman Inceleme

```mermaid
flowchart TD
    A["WaitingExpertAssignment"] --> B["Secretariat assigns ethics expert"]
    B --> C["ExpertAssigned"]
    C --> D["Expert starts review"]
    D --> E["UnderExpertReview"]
    E --> F{"Expert decision"}
    F -->|RevisionRequested| G["ExpertRevisionRequested"]
    G --> H["Applicant revision response"]
    H --> E
    F -->|Approved| I["ExpertApproved"]
```

## 6. Sekreterya Paketleme ve Kurul Gundemi

```mermaid
flowchart TD
    A["ExpertApproved"] --> B["Package queue"]
    B --> C["Secretariat prepares package"]
    C --> D["PackageReady"]
    D --> E["Committee agenda queue"]
    E --> F["Add to committee agenda"]
    F --> G["UnderCommitteeReview"]
```

## 7. Kurul Karari

```mermaid
flowchart TD
    A["UnderCommitteeReview"] --> B{"Committee decision"}
    B -->|RevisionRequested| C["CommitteeRevisionRequested"]
    C --> D["Applicant committee revision response"]
    D --> A
    B -->|Approved| E["Approved"]
    B -->|Rejected| F["Rejected"]
```

## 8. Uctan Uca Demo Sirasi

Bu sira UI'daki `Basvuru demo akisi` ve `Uzman + kurul demo akisi` butonlari ile otomatik kosulur.

| Sira | Adim | Beklenen sonuc |
| --- | --- | --- |
| 1 | Register | `pending_identity_check` |
| 2 | Verify identity | `contact_pending` |
| 3 | Confirm email/SMS | `active` |
| 4 | Login | JWT hazir |
| 5 | Profile create/update | `%100` |
| 6 | Policy probe | `ready` |
| 7 | Application create to submit | `WaitingExpertAssignment` |
| 8 | Expert assignment/review/revision/approval | `ExpertApproved` |
| 9 | Package and agenda | `UnderCommitteeReview` |
| 10 | Committee revision/response/approval | `Approved` |

## 9. UI Route Gecisleri

| Kaynak | Tetikleyici | Hedef |
| --- | --- | --- |
| `/login` | Basarili login, profil eksik | `/workspace/profile` |
| `/login` | Basarili login, basvuru erisimi hazir | `/workspace/application` |
| `/register` | Basarili kayit | `/workspace/identity` |
| `/workspace/identity` | Email veya SMS onayi ile hesap aktif | `/workspace/profile` |
| `/workspace/profile` | Profil `%100` | `/workspace/application` |
| `/workspace/application` | Basvuru validation + submit basarili | `/workspace/review` |
| Herhangi workspace | Akisi sifirla | `/login` |
