# Etik Kurul Basvuru Backend

Bu klasor Etik Kurul platformunun backend alt projesidir.

## Calistirma

Docker ile tum sistemi kaldirmak icin `C:\Users\ilker\Documents\Playground\etik-kurul-platform` altindaki kok `docker-compose.yml` kullanilir. Bu klasorde ayrica bir compose giris noktasi tutulmaz.

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
- `POST /applications` endpoint'i `CanOpenApplication` policy'si ile korunur ve gercek draft application kaydi olusturur.
- `POST /applications/{id}/entry-mode`, `POST /applications/{id}/intake`, `POST /applications/{id}/committee`, `POST /applications/{id}/forms/{formCode}`, `POST /applications/{id}/documents` ve `POST /applications/{id}/validate` endpoint'leri ayni kullanicinin draft basvurusunu Faz 1 application hazirlik akisi boyunca ilerletir.
- Uygulama acilisinda relational veritabani mevcut olup yeni `applications` semasi eksikse, yalnizca bu izole stack icin sema yeniden kurulur.
- Container ici ortamda HTTPS redirection kapatilidir; ters proxy arkasinda calisacaksaniz ayri olarak etkinlestirebilirsiniz.
