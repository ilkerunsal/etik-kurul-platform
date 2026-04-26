# Project Docs

Bu klasor Etik Kurul Platformu icin urun, akis ve teknik referans dokumanlarini tutar. Dokumanlar mevcut kod tabanina gore hazirlanmistir.

## Dokumanlar

| Dosya | Icerik |
| --- | --- |
| `site-map.md` | Kullanici arayuzu ekranlari, paneller, gorunurluk kosullari ve ana navigasyon mantigi |
| `workflows.md` | Kayit, kimlik dogrulama, profil, basvuru, uzman inceleme ve kurul karar akis diagramlari |
| `roles-and-permissions.md` | Seed roller, policy kurallari ve rol bazli yetki matrisi |
| `api-map.md` | Backend endpoint haritasi, auth/policy bilgisi ve endpoint amaclari |
| `architecture.md` | Modular monolith yapi, bounded contextler, veri guvenligi, adapterlar ve Docker topolojisi |

## Kisa Baglam

Proje tek kok repo icinde calisan bir modular monolith uygulamasidir.

| Katman | Teknoloji | Not |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript | `frontend` klasoru |
| Backend | .NET 10 Web API | `backend/src` klasoru |
| Database | PostgreSQL | Docker portu `5436` |
| Local frontend | Nginx container | `http://localhost:3006` |
| Local API | .NET container | `http://localhost:8086` |

## Guncelleme Kurali

Kodda yeni ekran, endpoint, rol veya durum gecisi eklendiginde ilgili dokuman ayni is paketi icinde guncellenmelidir. Ozellikle `workflows.md` ve `api-map.md`, smoke test kapsamiyla birlikte canli tutulmalidir.

