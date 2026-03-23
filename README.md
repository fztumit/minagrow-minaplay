# MinaGrow MinaPlay

MinaPlay, `MinaGrow` markasi altinda gelistirilen cocuk odakli bir konusma pratiği PWA'sidir. Uygulama telefon ve tablet icin tasarlanmistir; dokunma, dinleme, tekrar, ebeveyn kaydi ve gunluk aktivite akislari uzerine kuruludur.

Canli surum:

- `https://minagrow-minaplay-production.up.railway.app/`

## Mevcut Moduller

- `Konusma Oyunu`
  - `su, anne, baba, top, araba, kitap, elma, sut, ekmek`
  - nesneye dokununca kelime tekrar edilir
  - `su` kartinda buyuyen bardak ve dokulme animasyonu vardir
- `Hikayeler`
  - kolay ve standart seviye
  - paket secimi
  - kolay cumle ekleme / silme
  - hikaye ses kaydi
- `Gunun Kelimesi`
  - gunluk vurgulu kelime
  - ebeveyn ses kaydi / oynatma
- `Gunluk Aktivite Karti`
  - `3 kelime`
  - `1 hikaye`
  - `1 etkilesim`
  - gunluk reset
- `Uyku Modu`
  - uyuyan anka
  - farkli uyku sesleri
  - zamanlayici
- `Aile Avatarlari`
  - isim, renk, fotograf
  - localStorage kaliciligi

## Teknik Yapi

- `Frontend`: HTML + CSS + moduler TypeScript
- `Backend`: Node.js + Express + TypeScript
- `PWA`: manifest + service worker
- `Storage`: agirlikli olarak `localStorage`
- `Deploy`: Railway
- `Repo`: GitHub `fztumit/minagrow-minaplay`

## Proje Yapisi

```text
public/
  index.html
  style.css
  manifest.webmanifest
  sw.js
  assets/
  js/

src/
  app.ts
  server.ts
  config/
  modules/

tests/
  playwright/
  segmentation.test.ts
  webhook-verify.test.ts
```

## Gelistirme

```bash
npm install
npm run build
npm run dev
```

Uygulama varsayilan olarak `http://localhost:3000` uzerinden acilir.

## Scriptler

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Deploy

Railway uzerinde servis Dockerfile ile build edilir.

- Build: Dockerfile icindeki `RUN npm run build`
- Start: Dockerfile icindeki `CMD ["npm", "run", "start"]`
- Healthcheck: `/health`

## Notlar

- Kod tabani, ilk asamada CRM tabanli bir Node/Express reposundan evrilmistir.
- Bu nedenle `src/routes/webhooks.ts`, `src/services/zoho.ts` gibi bazi legacy dosyalar hala repoda bulunmaktadir.
- Canli urunun ana yuzu PWA tarafidir; siradaki teknik temizlik adimlarindan biri legacy CRM parcaciklarini ayirmak veya temizlemektir.
