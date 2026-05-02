# Etik Kurul Platform

Bu klasor Etik Kurul uygulamasinin tek kok projesidir. Docker tarafinda yalnizca bu klasordeki `docker-compose.yml` kullanilir; ayri backend veya frontend stack'i yoktur.

## Yapi

- `backend`: .NET 10 Web API ve moduller
- `frontend`: React istemcisi
- `scripts`: smoke test ve yardimci scriptler
- `project_docs`: site map, is akislari, rol/yetki, API ve mimari referans dokumanlari

## Calistirma

1. `C:\Users\ilker\Documents\etik-kurul-platform` klasorune girin.
2. Gerekirse `.env.example` dosyasini `.env` olarak kopyalayin.
3. `docker compose up -d --build` komutunu calistirin.

Varsayilan adresler:

- Frontend: `http://localhost:3006`
- Backend API: `http://localhost:8086`
- Backend liveness: `http://localhost:8086/health/live`
- Backend readiness: `http://localhost:8086/health/ready`
- PostgreSQL: `localhost:5436`

## Production Guardrails

- Production modunda veya `REQUIRE_PRODUCTION_SECRETS=true` iken API default JWT/encryption secret'lari, default PostgreSQL parolasi ve dev mock endpointleri ile acilmaz.
- Docker healthcheck API icin `/health/ready`, frontend icin `/health` kullanir; frontend API hazir olmadan baslatilmaz.
- Canli ortamda `.env.example` degerlerini dogrudan kullanmayin; `POSTGRES_PASSWORD`, `ENCRYPTION_BASE64_KEY` ve `JWT_SIGNING_KEY` degerlerini secret store veya deployment secret mekanizmasindan verin.

## Smoke Test

Faz 1 ve application demo akislarini frontend proxy uzerinden dogrulamak icin:

`powershell -ExecutionPolicy Bypass -File .\scripts\smoke-phase1.ps1`

Script sirayla kayit, kimlik dogrulama, mock kod cekme, email aktivasyonu, JWT login, `auth/me`, `auth/application-access`, policy probe, profil olusturma ve guncelleme, ardindan `applications` akisindaki create, committee, form, document, validation, submit, secretariat uzman atama, expert review start, expert revision request, applicant revision response, expert approval, sekretarya paketleme, kurul gundemine alma, kurul revizyon talebi, applicant kurul revizyon yaniti ve kurul onayi adimlarini calistirir; sonucu JSON olarak basar.
