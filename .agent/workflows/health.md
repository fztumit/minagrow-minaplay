---
name: health
description: MinaGrow/MinaPlay içindeki proje omurgasının, meta hafızasının, agent davranışının ve repo yönünün sağlıklı kalıp kalmadığını değerlendirme akışını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Health

Bu workflow, `MinaGrow / MinaPlay` içinde sağlık kontrolü gerektiğinde kullanılır.

## Ne Zaman Kullanılır?

- kullanıcı "sağlık kontrolü" isterse
- meta ve gerçek kodun uyumu sorgulanırsa
- agent yanlış bağlamla başlamışsa
- Konusu-Yorum referansı ile MinaGrow hedefi karışmış görünürse
- kod taşıma öncesi durum değerlendirmesi gerekirse

## Sağlık Alanları

### Proje Sağlığı

Kontrol:

- proje adı ve ürün yönü net mi
- `MinaGrow`, `MinaPlay`, `Konusu-Yorum` ayrımı korunuyor mu
- çocuk odaklı PWA amacı görünür mü

### Mimari Sağlığı

Kontrol:

- gerçek teknoloji yığını doğru yazılmış mı
- Node/Express + modüler TypeScript PWA yönü korunuyor mu
- gereksiz büyük backend veya monorepo varsayımı üretilmiş mi
- legacy CRM parçaları ürün çekirdeğiyle karıştırılıyor mu

### Veri Sağlığı

Kontrol:

- localStorage modeli doğru anlatılmış mı
- storage key'ler görünür mü
- ses kayıt kapasite riski notlanmış mı
- çocuk profili/cloud sync gibi açık kararlar uydurulmuş mu

### Web/UX Sağlığı

Kontrol:

- çocuk ekranı sade kalıyor mu
- ebeveyn araçları ana deneyimi boğuyor mu
- mobil/tablet hedefi korunuyor mu
- Türkçe ürün dili temiz mi

### Agent Sağlığı

Kontrol:

- ajan kullanıcıyı Ümit olarak okuyor mu
- eski hazır bağlam kalıntısı var mı
- workflow'lar MinaPlay'e göre davranıyor mu
- açık uygulama isteği doğru yorumlanıyor mu

## Sağlık Çıktısı

Sağlık kontrolü yapılırken çıktı şu sırayla verilir:

1. güçlü alanlar
2. açık riskler
3. önerilen küçük düzeltmeler
4. gerekiyorsa uygulama paketi

Kullanıcı yalnız sağlık kontrolü istediyse dosya değiştirilmez.

## Kısa Kural

Sağlık kontrolü önce teşhis eder.

Uygulama ancak kullanıcı açıkça isterse yapılır.
