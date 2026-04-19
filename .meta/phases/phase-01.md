---
name: phase-01
description: MinaGrow/MinaPlay için meta ve agent hizalama fazını, kapsamını ve iş paketlerini tanımlar.
created: 2026-04-17
updated: 2026-04-19
---

# Phase 01 - Meta ve Agent Hizalaması

## Amaç

Bu fazın amacı, başka projeden hazır gelen `.meta`, `.agent` ve agent giriş protokolünü `MinaGrow` üst bağlamındaki `MinaPlay` projesine uygun hale getirmektir.

## Kapsam

Dahil:

- proje kimliğini `MinaPlay` olarak, `MinaGrow`u üst bağlam olarak yazmak
- `Konusu-Yorum` referans reposunu görünür kılmak
- Ümit + Codex çalışma modelini tanımlamak
- PWA mimarisini ve veri modelini belgelemek
- aktif plan ve açık notları yeni ürün bağlamına çekmek
- eski hazır bağlam izlerini temizlemek

Hariç:

- uygulama kodunu taşımak
- Railway deploy ayarlarını değiştirmek
- PWA davranışı üzerinde kod değişikliği yapmak
- storage migration uygulamak

## İş Paketleri

### Paket 01 - Referans Okuma

Amaç:

- `Konusu-Yorum` içindeki README, progress, package scriptleri ve modül yapısını okumak

Kapanış ölçütü:

- ürün modülleri, teknik yapı ve doğrulama hattı anlaşılmış olur

### Paket 02 - Meta Yeniden Yazımı

Amaç:

- `.meta` dosyalarını `MinaPlay` ürün bağlamına çekmek

Kapanış ölçütü:

- proje, mimari, veri modeli, web, tema, köken, geçiş, plan, not ve worklog dosyaları yeni bağlamı taşır

### Paket 03 - Agent Yeniden Yazımı

Amaç:

- `.agent` dosyalarını Ümit + Codex iş birliği ve MinaPlay ürün akışına göre düzenlemek

Kapanış ölçütü:

- context ve workflow dosyaları eski hazır bağlam yerine Ümit/MinaGrow/MinaPlay bağlamını taşır

### Paket 04 - Giriş Protokolü

Amaç:

- kök `AGENTS.md` dosyasını gelecekte doğru açılış üretecek hale getirmek

Kapanış ölçütü:

- yeni sohbetlerde ajan kendini MinaGrow/MinaPlay içinde konumlandırır

## Faz Kapanışı

Bu faz, doküman ve agent hafızası doğru bağlama çekildiğinde kapanır.

Sonraki faz, V1 referansındaki davranış ve ürün derslerinden yararlanarak `MinaPlay` alanında V2 temiz ürün omurgasının nasıl kurulacağını netleştirmelidir.
