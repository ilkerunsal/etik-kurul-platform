# Etik Kurul Frontend

Bu proje React tabanli Faz 1 istemcisidir. Kayit, kimlik dogrulama, iletisim kodu onayi ve profil tamamlama akisini tek arayuzde toplar.

## Calistirma

Docker ile tum sistemi kaldirmak icin `C:\Users\ilker\Documents\Playground\etik-kurul-platform` altindaki kok `docker-compose.yml` kullanilir. Bu klasorde ayrica bir compose giris noktasi tutulmaz.

Varsayilan erisim adresleri kok projeden:

- Frontend: `http://localhost:3006`
- Frontend health: `http://localhost:3006/health`

Frontend, Docker stack icinde backend isteklerini `http://api:8080` upstream'ine proxy eder.
