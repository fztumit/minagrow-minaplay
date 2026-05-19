---
name: phase-02
description: MinaGrow/MinaPlay için V1 referansından MinaPlay V2 temiz ürün omurgasına geçiş fazını tanımlar.
created: 2026-04-17
updated: 2026-04-27
---

# Phase 02 - V2 Temiz Ürün Omurgası

## Amaç

Bu fazın amacı, V1 referansındaki işe yarayan davranış ve ürün derslerini kaybetmeden `/Users/umitaydin/Documents/Studio-workspace-Project` alanında yeni `MinaPlay V2` ürün omurgasını kurmaktır. V1 doğrudan taşınacak uygulama temeli değil; fikir, davranış ve örnekleme referansıdır.

`/Users/umitaydin/Documents/MinaGrow/MinaPlay` altında görülen uygulama izi bu fazın kanonik geliştirme hedefi değildir. Bu alan eski/ara çalışma izi, karşılaştırma kaynağı veya geçici referans olarak ele alınır.

## Kapsam

Dahil:

- V2 tasarım sistemi ve MVP çekirdeğini kurmak
- V1'den alınacak davranışları belirlemek
- eski UI, CSS, asset ve legacy parçaları dışarıda bırakmak
- MinaPlay ürün adlandırmasını tutarlı hale getirmek
- build/lint/test/e2e hattını V2 hedefte çalıştırmak
- Railway deploy etkisini değerlendirmek

Hariç:

- büyük backend mimarisi kurmak
- kullanıcı hesabı veya cloud sync açmak
- içerik yönetim paneli yapmak
- V1'i birebir kopyalamak
- tüm modları aynı anda üretime almak

## V2 İlkeleri

- ürün davranışı korunur, UI ve uygulama omurgası temiz kurulur
- `node_modules`, `dist`, `output`, `test-results` gibi üretilebilir çıktılar V2 kaynağı sayılmaz
- asset yolları ve service worker cache davranışı V2'ye göre yeniden belirlenir
- package scriptleri `Studio-workspace-Project` içinde doğrulanır
- legacy CRM dosyalarının ürün çekirdeğiyle ilişkisi ayrı karar olarak görünür tutulur

## İş Paketleri

### Paket 01 - V1 Referans Haritası

Amaç:

- V1'den alınacak davranış, modül fikri, Parent panel değeri ve Pofi kararlarını netleştirmek

Kapanış ölçütü:

- V2'ye alınacak referans davranış listesi çıkar

### Paket 02 - V2 Uygulama Omurgası

Amaç:

- `Studio-workspace-Project` alanında yeni ana ekran, Dokun, Eşleme, Ayna, Uyku ve temel Parent panel omurgasını kurmak

Kapanış ölçütü:

- `Studio-workspace-Project` içinde V2 install/build çalışabilecek duruma gelir

### Paket 03 - Kimlik Temizliği

Amaç:

- görünen ürün adı, README ve package metadata alanlarını MinaGrow/MinaPlay yönüne çekmek

Kapanış ölçütü:

- `Konusu-Yorum` yalnız tarihsel referans veya teknik migration alanı olarak kalır

### Paket 04 - Doğrulama

Amaç:

- `Studio-workspace-Project` içinde build, lint, unit ve e2e doğrulamasını çalıştırmak

Kapanış ölçütü:

- temel komutlar geçer veya açık kalan kırıklar notlanır

## Faz Kapanışı

Bu faz, `Studio-workspace-Project` V2 MVP omurgasını çalıştırdığında ve doğrulama hattı bu hedefte anlamlı şekilde çalıştığında kapanır.
