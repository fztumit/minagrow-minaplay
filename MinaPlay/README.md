# MinaPlay

MinaPlay, `MinaGrow` üst bağlamında geliştirilen 0-5 yaş başlangıç odaklı konuşma, taklit, duygu ve etkileşim PWA uygulamasıdır. Bu klasör, `Konusu-Yorum` referans reposundan temizlenerek taşınmış sade uygulama çekirdeğidir.

## Ürün Yönü

- Hedef cihaz: telefon ve tablet
- Dil: Türkçe
- Ana karakter/davranış sistemi: Pofi
- Çocuk yüzeyi: sade, sakin ve düşük uyarımlı
- Parent panel: analiz, kontrol ve izleme katmanı
- Gelecek vizyon: 0-18 yaş, okul öncesi, örgün öğretim, gönüllü eğitimci ağı ve terapist/eğitimci desteği

## Bugünkü Çekirdek

- Dokun/Dinle akışı
- Hikaye ve kolay cümle akışı
- Günlük kelime
- Günlük aktivite kartı
- Uyku modu
- Aile avatarları
- Ebeveyn ses kaydı
- PWA manifest ve service worker
- Minimal Express static server ve `/health`

## Teknik Yapı

- Frontend: HTML, CSS, modüler TypeScript
- Backend: minimal Node.js + Express + TypeScript
- PWA: `manifest.webmanifest` + `sw.js`
- Storage: ağırlıklı olarak `localStorage`
- Test: Vitest + Playwright
- Deploy: Dockerfile + Railway uyumlu start

## Geliştirme

```bash
npm install
npm run build
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` üzerinden açılır.

## Scriptler

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Temiz Taşıma Notu

Bu uygulama alanına CRM, Zoho, webhook, lowdb, segmentation ve eski ham tasarım dosyaları taşınmadı. Kaynak referans repo:

- `/Users/umitaydin/Documents/Konusu-Yorum`
- kaynak commit: `40e0fe3 feat: redesign Anka mascot states and motion`

Eski repo yalnız çalışan davranış referansı olarak tutulur.
