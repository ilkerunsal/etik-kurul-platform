# Roles and Permissions

Bu dokuman mevcut seed rollerini ve backend authorization policy kurallarini listeler.

## Seed Roller

| Role code | Ad | Mevcut kullanim |
| --- | --- | --- |
| `researcher` | Arastirmaci | Varsayilan kayit rolu, basvuru sahibi |
| `principal_researcher` | Sorumlu Arastirmaci | Seed var, bu fazda ayrik is mantigi yok |
| `assistant_researcher` | Yardimci Arastirmaci | Seed var, bu fazda ayrik is mantigi yok |
| `ethics_expert_candidate` | Etik Uzman Adayi | Seed var, bu fazda ayrik aday akis mantigi yok |
| `ethics_expert` | Etik Uzman | Uzman inceleme policy'si |
| `secretariat` | Sekreterya | Uzman atama, paketleme, kurul gundemi ve kurul kararlari |
| `admin` | Admin | Seed var, bu fazda policy baglantisi yok |
| `super_admin` | Super Admin | Seed var, bu fazda policy baglantisi yok |

## Policy Kurallari

| Policy | Gereksinim | Kullanildigi alan |
| --- | --- | --- |
| `CanOpenApplication` | Authenticated user + aktif hesap + profil esigi | `POST /applications`, `/auth/application-access/probe` |
| `ManageExpertAssignments` | Role: `secretariat` | Uzman atama kuyrugu ve atama |
| `StartExpertReview` | Role: `ethics_expert` | Uzman is listesi, review start, revizyon talebi, uzman onayi |
| `ManageCommitteeAgenda` | Role: `secretariat` | Paketleme, gundem, kurul revizyon/onay/red kararlari |

## Yetki Matrisi

| Islem | researcher | ethics_expert | secretariat | admin/super_admin |
| --- | --- | --- | --- | --- |
| Kayit olma | Evet | Evet, once standart kayit gerekir | Evet, demo/dev rolu sonradan atanir | Evet, policy bagli degil |
| Login | Evet | Evet | Evet | Evet |
| Profil olusturma/guncelleme | Evet | Evet | Evet | Evet |
| Basvuru acma | Evet, `CanOpenApplication` gecerse | Teknik olarak policy uygunsa, ancak urun akisinda arastirmaci hedeflenir | Teknik olarak policy uygunsa | Bu fazda ayrik admin policy yok |
| Basvuru form/dokuman/submit | Basvuru sahibi | Hayir | Hayir | Bu fazda ayrik admin policy yok |
| Uzman atama | Hayir | Hayir | Evet | Hayir |
| Uzman review baslatma | Hayir | Evet | Hayir | Hayir |
| Uzman revizyon/onay karari | Hayir | Evet | Hayir | Hayir |
| Revizyon yaniti | Basvuru sahibi | Hayir | Hayir | Hayir |
| Paket hazirlama | Hayir | Hayir | Evet | Hayir |
| Kurul gundemine alma | Hayir | Hayir | Evet | Hayir |
| Kurul revizyon/onay/red karari | Hayir | Hayir | Evet | Hayir |

## Dev Endpoint Notu

`POST /dev/roles/assign` mevcut demo ve smoke test ihtiyaci icin rol atar. Bu endpoint gercek uretim yetkilendirme modeli degildir.

## Onemli Kural

Etik uzman adayi veya uzman kullanicilari da standart kullanici kayit ve kimlik dogrulama akisindan gecmelidir. Mevcut demo akisi, bu kullanicilari arka planda olusturup dev role assignment ile gerekli role tasir.

