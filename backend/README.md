# Etik Kurul Basvuru Backend

Bu klasor Etik Kurul platformunun backend alt projesidir.

## Calistirma

Docker ile tum sistemi kaldirmak icin `C:\Users\ilker\Documents\etik-kurul-platform` altindaki kok `docker-compose.yml` kullanilir. Bu klasorde ayrica bir compose giris noktasi tutulmaz.

Varsayilan erisim adresleri kok projeden:

- API: `http://localhost:8086`
- Health: `http://localhost:8086/health`
- PostgreSQL: `localhost:5436`

## Notlar

- Uygulama baslarken veritabani semasini otomatik olarak olusturur.
- TCKN ve dogum tarihi verileri uygulama seviyesinde sifrelenerek saklanir.
- JWT oturum katmani etkindir. Gerekirse `.env` icinde `JWT_SIGNING_KEY` degerini override edebilirsiniz.
- `ApplicationAccess:MinimumProfileCompletionPercent` veya Docker env karsiligi `APPLICATION_ACCESS_MIN_PROFILE_COMPLETION_PERCENT` verilmezse sistem basvuru acma yetkisini `minimum_profile_completion_not_configured` gerekcesiyle kapali dondurur.
- `POST /profile` endpoint'i yetkilidir; kullanici kimligi request body'sinden degil bearer token claim'lerinden alinir.
- `PUT /profile/me` endpoint'i yetkilidir; kullanici kendi profilini ayni Faz 1 alan setiyle guncelleyebilir.
- `GET /profile/me` endpoint'i yetkilidir; oturumdaki kullanicinin mevcut profilini `404` veya profil verisi olarak dondurur.
- `GET /auth/application-access` endpoint'i yetkilidir; token'daki kullanici icin basvuru acma hazirlik degerlendirmesini dondurur.
- `GET /auth/application-access/probe` endpoint'i `CanOpenApplication` policy'si ile korunur; gelecekteki basvuru endpoint'leri icin authorization davranisini bugunden dogrulamak icin kullanilabilir.
- `GET /committees` endpoint'i yetkilidir; aktif komite seed verilerini dondurur.
- `GET /applications` ve `GET /applications/{id}` endpoint'leri yetkilidir; kullanicinin kendi basvurularini ve secili basvuru ozetini dondurur.
- `POST /applications` endpoint'i `CanOpenApplication` policy'si ile korunur ve gercek draft application kaydi olusturur.
- `POST /applications/{id}/entry-mode`, `POST /applications/{id}/intake`, `POST /applications/{id}/committee`, `POST /applications/{id}/forms/{formCode}`, `POST /applications/{id}/documents` ve `POST /applications/{id}/validate` endpoint'leri ayni kullanicinin draft basvurusunu Faz 1 application hazirlik akisi boyunca ilerletir.
- `POST /applications/{id}/submit` endpoint'i sistem validation'ini gecen draft basvuruyu `Submitted / WaitingExpertAssignment` durumuna tasir; cekirdek kural geregi basvuru uzman inceleme kuyruguna hazir hale gelir.
- `GET /applications/expert-assignment/queue` endpoint'i `secretariat` rolune aciktir ve uzman atamasi bekleyen basvurulari listeler.
- `POST /applications/{id}/expert-assignment` endpoint'i `secretariat` rolune aciktir; aktif `ethics_expert` rolundeki kullaniciyi basvuruya atar ve adimi `ExpertAssigned` yapar.
- `GET /applications/expert-review/me` endpoint'i `ethics_expert` rolune aciktir; oturumdaki uzmana atanmis aktif basvurulari dondurur.
- `POST /applications/{id}/expert-review/start` endpoint'i `ethics_expert` rolune aciktir; yalnizca kendisine atanmis basvuruda incelemeyi baslatir ve adimi `UnderExpertReview` yapar.
- `POST /applications/{id}/expert-review/request-revision` endpoint'i `ethics_expert` rolune aciktir; uzman revizyon talebini audit kaydi olarak saklar ve adimi `ExpertRevisionRequested` yapar.
- `POST /applications/{id}/revision-response` endpoint'i basvuru sahibine aciktir; son uzman revizyon talebine yanit kaydi olusturur ve basvuruyu tekrar `UnderExpertReview` adimina tasir.
- `POST /applications/{id}/expert-review/approve` endpoint'i `ethics_expert` rolune aciktir; uzman onayini audit kaydi olarak saklar ve adimi `ExpertApproved` yapar.
- `GET /applications/secretariat/package-queue` ve `POST /applications/{id}/secretariat/package` endpoint'leri `secretariat` rolune aciktir; uzman onayi gelen basvuruyu paketler ve adimi `PackageReady` yapar.
- `GET /applications/committee-agenda/queue` ve `POST /applications/{id}/committee-agenda` endpoint'leri `secretariat` rolune aciktir; paketlenen basvuruyu secili kurulun gundemine alir ve adimi `UnderCommitteeReview` yapar.
- `POST /dev/roles/assign` endpoint'i sadece development mock araclari acikken kullanilir; smoke/demo akislari icin kullaniciya seed role atamasi yapar.
- Uygulama acilisinda relational veritabani mevcut olup yeni `applications`, `application_expert_assignments`, `application_expert_review_decisions`, `application_revision_responses`, `application_review_packages` veya `application_committee_agenda_items` semasi eksikse, yalnizca bu izole stack icin sema yeniden kurulur.
- Container ici ortamda HTTPS redirection kapatilidir; ters proxy arkasinda calisacaksaniz ayri olarak etkinlestirebilirsiniz.
