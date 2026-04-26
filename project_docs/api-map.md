# API Map

Bu dokuman backend controller endpointlerini mevcut implementasyona gore listeler. Frontend container uzerinden erisimde endpointler `/api` prefix'i ile proxylenir.

## Auth

| Method | Path | Auth | Amac |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Kullanici kaydi, TCKN/dogum tarihi sifreli saklama, `researcher` rolu |
| POST | `/auth/verify-identity` | Public | Kayitli kullanici icin mock NVI kontrolu |
| POST | `/auth/send-code` | Public | Email veya SMS icin yeni kod uretme |
| POST | `/auth/confirm-code` | Public | Email veya SMS kodu dogrulama |
| POST | `/auth/login` | Public | JWT access token uretme |
| GET | `/auth/me` | JWT | Aktif kullanici, roller ve basvuru erisimi |
| GET | `/auth/application-access` | JWT | Basvuru acma erisim durumunu dondurur |
| GET | `/auth/application-access/probe` | JWT + `CanOpenApplication` | Policy probe, basariliysa `ready` |

## Profile

| Method | Path | Auth | Amac |
| --- | --- | --- | --- |
| POST | `/profile` | JWT | Ilk profil kaydini olusturur |
| GET | `/profile/me` | JWT | Mevcut profil bilgisini dondurur |
| PUT | `/profile/me` | JWT | Mevcut profili gunceller |

## Committees

| Method | Path | Auth | Amac |
| --- | --- | --- | --- |
| GET | `/committees` | JWT | Aktif komite lookup listesini dondurur |

## Applications

| Method | Path | Auth/Policy | Amac |
| --- | --- | --- | --- |
| GET | `/applications` | JWT | Kullanici basvurularini listeler |
| GET | `/applications/{id}` | JWT | Basvuru detay ozeti |
| POST | `/applications` | JWT + `CanOpenApplication` | Basvuru taslagi olusturur |
| POST | `/applications/{id}/entry-mode` | JWT | Direct/Guided secimi |
| POST | `/applications/{id}/intake` | JWT | Intake cevaplari ve routing assessment |
| POST | `/applications/{id}/committee` | JWT | Komite secimi |
| POST | `/applications/{id}/forms/{formCode}` | JWT | Basvuru form kaydi |
| POST | `/applications/{id}/documents` | JWT | Dokuman metadata kaydi |
| POST | `/applications/{id}/validate` | JWT | Sistem kontrol checklist ve validation |
| POST | `/applications/{id}/submit` | JWT | Basvuruyu uzman atama bekleme adimina tasir |
| POST | `/applications/{id}/revision-response` | JWT | Uzman revizyon talebine arastirmaci yaniti |
| POST | `/applications/{id}/committee-revision-response` | JWT | Kurul revizyon talebine arastirmaci yaniti |

## Expert Workflow

| Method | Path | Auth/Policy | Amac |
| --- | --- | --- | --- |
| GET | `/applications/expert-assignment/queue` | JWT + `ManageExpertAssignments` | Sekreterya uzman atama kuyrugu |
| POST | `/applications/{id}/expert-assignment` | JWT + `ManageExpertAssignments` | Etik uzman atama |
| GET | `/applications/expert-review/me` | JWT + `StartExpertReview` | Uzmanin is listesi |
| POST | `/applications/{id}/expert-review/start` | JWT + `StartExpertReview` | Uzman incelemeyi baslatir |
| POST | `/applications/{id}/expert-review/request-revision` | JWT + `StartExpertReview` | Uzman revizyon ister |
| POST | `/applications/{id}/expert-review/approve` | JWT + `StartExpertReview` | Uzman onayi |

## Secretariat and Committee Workflow

| Method | Path | Auth/Policy | Amac |
| --- | --- | --- | --- |
| GET | `/applications/secretariat/package-queue` | JWT + `ManageCommitteeAgenda` | Paketlemeye hazir basvurular |
| POST | `/applications/{id}/secretariat/package` | JWT + `ManageCommitteeAgenda` | Inceleme paketi hazirlar |
| GET | `/applications/committee-agenda/queue` | JWT + `ManageCommitteeAgenda` | Kurul gundemine alinacak paketler |
| POST | `/applications/{id}/committee-agenda` | JWT + `ManageCommitteeAgenda` | Basvuruyu kurul gundemine ekler |
| POST | `/applications/{id}/committee-review/request-revision` | JWT + `ManageCommitteeAgenda` | Kurul revizyon talebi |
| POST | `/applications/{id}/committee-review/approve` | JWT + `ManageCommitteeAgenda` | Kurul onayi |
| POST | `/applications/{id}/committee-review/reject` | JWT + `ManageCommitteeAgenda` | Kurul red karari |

## Development

| Method | Path | Auth | Amac |
| --- | --- | --- | --- |
| GET | `/dev/mock-messages` | Public | Mock email/SMS kutusu okuma |
| POST | `/dev/roles/assign` | Public | Demo kullanicisina rol atama |

## Health

| Method | Path | Auth | Amac |
| --- | --- | --- | --- |
| GET | `/health` | Public | API health kontrolu |

## Hata Formati

Backend bilinen hatalar icin `application/problem+json` dondurur. Frontend API client, hem `application/json` hem de `application/problem+json` govdelerini okuyacak sekilde ayarlanmistir.

