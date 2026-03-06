# Tasarim Teknesi CRM + WhatsApp + Meta Entegrasyonu (MVP)

Bu proje, WhatsApp Cloud API ve Meta (Instagram/Facebook) webhook mesajlarini tek Node.js serviste toplayip Zoho CRM'e Lead olarak aktarir.

## Ozellikler

- `GET /webhooks/whatsapp`, `POST /webhooks/whatsapp`
- `GET /webhooks/meta`, `POST /webhooks/meta`
- Meta webhook verify token kontrolu
- Opsiyonel `x-hub-signature-256` HMAC imza dogrulamasi (`META_APP_SECRET` varsa)
- Mesajdan otomatik alan cikarimi:
  - `qty`: `10 adet`, `50 tane`
  - `product_code`: 4-6 haneli kod (`10516`)
  - `logoRequested`: varsayilan `true`, mesajda `logosuz` gecerse `false`
- Zoho custom logo alani map'i:
  - Segment API name env ile degistirilebilir: `ZOHO_SEGMENT_FIELD_API_NAME` (varsayilan: `segment`)
  - Varsayilan API name: `logo_requested_`
  - Varsayilan tip: `select` (`Evet` / `Hayir`)
  - Gerekirse `checkbox` tipe env ile gecilebilir
- Segment/stage kurallari:
  - S1 `< 7500`
  - S2 `7500-24999`
  - S3 `25000-49999`
  - S4 `>= 50000`
  - Adet yok: `UNKN`, stage `Ön Bilgi Bekleniyor`
  - Adet var + urun kodu yok: stage `Ürün Netleşiyor`
  - Adet + urun kodu var: stage `Teklif Verilecek`
- Zoho CRM Lead upsert (telefon bazli)
- Follow-up task olusturma (+3/+10/+30/+180 gun):
  - Yerel `lowdb` JSON db'ye yazilir
  - Zoho Tasks modulu acma denenir (hata alirsa yerelde devam eder)

## Teknoloji

- Node.js 20+
- TypeScript
- Express
- zod
- axios
- lowdb
- vitest + supertest

## Kurulum

```bash
npm install
cp .env.example .env
npm run dev
```

## ENV

`.env` ornegi:

```env
PORT=3000
META_VERIFY_TOKEN=your_verify_token
META_APP_SECRET=optional_meta_app_secret
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
ZOHO_API_DOMAIN=https://www.zohoapis.com
ZOHO_SEGMENT_FIELD_API_NAME=segment
ZOHO_LOGO_FIELD_API_NAME=logo_requested_
ZOHO_LOGO_FIELD_TYPE=select
ZOHO_LOGO_SELECT_TRUE_VALUE=Evet
ZOHO_LOGO_SELECT_FALSE_VALUE=Hayir
```

## Meta Webhook Verify

Meta verify istegi su query parametreleriyle gelir:

- `hub.mode=subscribe`
- `hub.verify_token=<META_VERIFY_TOKEN>`
- `hub.challenge=<random>`

Servis, token dogruysa challenge degerini geri dondurur.

## Zoho OAuth Refresh Akisi

1. Zoho'dan bir kez `refresh_token` alin.
2. `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN` ayarlayin.
3. Servis, runtime'da otomatik olarak access token yeniler.

Token yenileme endpoint'i:

- `POST https://accounts.zoho.com/oauth/v2/token`
- body (x-www-form-urlencoded): `refresh_token`, `client_id`, `client_secret`, `grant_type=refresh_token`

## Test ve Lint

```bash
npm run lint
npm run test
npm run build
```

## Docker

```bash
docker compose up --build
```

## Dizin Yapisi

```text
src/
  server.ts
  app.ts
  config/env.ts
  routes/webhooks.ts
  services/meta.ts
  services/zoho.ts
  domain/segmentation.ts
  domain/extract.ts
  db/index.ts
tests/
  segmentation.test.ts
  webhook-verify.test.ts
```

## Notlar

- MVP su an yalnizca text mesajlarini isler.
- Medya/attachment eventleri ignore edilir.
- Bu MVP'de tek kullanici varsayimi: Umit.
