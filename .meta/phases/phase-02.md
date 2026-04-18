---
name: phase-02
description: MinaGrow/MinaPlay için Konusu-Yorum referans uygulamasını hedef ürün alanına taşıma fazını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Phase 02 - Kod Taşıma ve Ürün Temizliği

## Amaç

Bu fazın amacı, `/Users/umitaydin/Documents/Konusu-Yorum` içindeki çalışan PWA uygulamasını kontrollü şekilde `/Users/umitaydin/Documents/MinaGrow/MinaPlay` alanına taşımak ve ürün kimliğini temizlemektir.

## Kapsam

Dahil:

- taşıma yöntemini belirlemek
- gerekli dosyaları seçmek
- gereksiz build çıktıları ve geçici dosyaları ayırmak
- MinaPlay ürün adlandırmasını tutarlı hale getirmek
- build/lint/test/e2e hattını yeni hedefte çalıştırmak
- Railway deploy etkisini değerlendirmek

Hariç:

- büyük backend mimarisi kurmak
- kullanıcı hesabı veya cloud sync açmak
- içerik yönetim paneli yapmak
- ürün davranışını baştan tasarlamak

## Taşıma İlkeleri

- çalışan davranış korunur
- `node_modules`, `dist`, `output`, `test-results` gibi üretilebilir çıktılar taşınmaz
- asset yolları ve service worker cache davranışı kontrol edilir
- package scriptleri yeni klasörde doğrulanır
- legacy CRM dosyalarının ürün çekirdeğiyle ilişkisi ayrı karar olarak görünür tutulur

## İş Paketleri

### Paket 01 - Taşıma Planı

Amaç:

- hangi dosyaların taşınacağını ve hangi dosyaların dışarıda kalacağını netleştirmek

Kapanış ölçütü:

- uygulanabilir dosya taşıma planı çıkar

### Paket 02 - Uygulama Kopyası

Amaç:

- seçilen kaynak dosyaları `MinaPlay` alanına almak

Kapanış ölçütü:

- hedef klasörde uygulama install/build çalışabilecek duruma gelir

### Paket 03 - Kimlik Temizliği

Amaç:

- görünen ürün adı, README ve package metadata alanlarını MinaGrow/MinaPlay yönüne çekmek

Kapanış ölçütü:

- `Konusu-Yorum` yalnız tarihsel referans veya teknik migration alanı olarak kalır

### Paket 04 - Doğrulama

Amaç:

- yeni hedef klasörde build, lint, unit ve e2e doğrulamasını çalıştırmak

Kapanış ölçütü:

- temel komutlar geçer veya açık kalan kırıklar notlanır

## Faz Kapanışı

Bu faz, MinaPlay klasörü çalışan uygulama kodunu taşıdığında ve doğrulama hattı yeni yerde anlamlı şekilde çalıştığında kapanır.
