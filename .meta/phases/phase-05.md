---
name: phase-05
description: MinaPlay Parent panel kontrol katmanı fazını, local-first mod görünürlüğü ve güvenli çocuk yüzeyi sınırlarını tanımlar.
created: 2026-06-16
updated: 2026-06-16
---

# Phase 05 - Parent Panel Kontrol Katmanı

## Amaç

Bu fazın amacı, Parent paneli yalnız izleyen ve yorumlayan bir yüzey olmaktan bir adım ileri taşıyıp ebeveynin aktif MVP çocuk modlarını güvenli biçimde yönetebilmesini sağlamaktır.

Faz 5 çocuk yüzeyine yeni mod eklemez. Dokun, Eşleme, Ayna, Uyku ve Ceee görünürlüğü local-first ayarla kontrol edilir; çocuğun ayar değiştirme veya gizlenen moda doğrudan geçme yolu kapalı tutulur.

## Kapsam

Dahil:

- Parent panelde aktif MVP modlarının görünürlüğü için kontrol alanı eklemek
- Dokun, Eşleme, Ayna, Uyku ve Ceee görünürlüğünü yerel kalıcı ayara bağlamak
- tüm modlar kapatılmak istendiğinde en az bir mod açık kalacak güvenlik kuralını uygulamak
- ana ekran kartları, alt navigasyon ve Ceee bonus girişini aynı görünürlük ayarıyla senkronlamak
- mod görünürlüğü normalizasyonunu unit testle ve Parent panel kontrol akışını e2e testle korumak

Hariç:

- yeni çocuk modu açmak
- bulut senkronu, hesap veya uzak ebeveyn kontrolü eklemek
- terapist/eğitimci paneli kurmak
- kullanım limiti, süre kilidi veya takvim planlama sistemi eklemek
- mevcut Pofi state sistemini yeniden mimarileştirmek

## İş Paketleri

### Paket 01 - Parent Panel Kontrol Yüzeyi

Amaç:

- ebeveynin aktif MVP modlarını ayrı ve okunabilir kontrollerle yönetmesini sağlamak

Kapanış ölçütü:

- Parent panelde beş aktif MVP modu için görünürlük checkbox'ları vardır
- kaydetme aksiyonu ebeveyn panelinde kalır
- çocuk yüzeyine ayar kontrolü taşınmaz

### Paket 02 - Local-first Mod Görünürlüğü

Amaç:

- mod görünürlüğünü sade, sürümlenebilir ve güvenli yerel ayara bağlamak

Kapanış ölçütü:

- görünürlük ayarı `minaplay_module_visibility_v1` anahtarıyla saklanır
- eksik veya bozuk kayıtlar güvenli varsayılanlara normalize edilir
- tüm modlar kapalı kayıt gelirse Dokun modu açık kalır

### Paket 03 - Çocuk Yüzeyi Senkronu

Amaç:

- gizlenen modların çocuk yüzeyinde görünmemesini ve doğrudan açılamamasını sağlamak

Kapanış ölçütü:

- ana ekran mod kartları ayara göre gizlenir
- alt navigasyon ayara göre gizlenir
- Ceee bonus girişi ayara göre gizlenir
- gizlenen bir moda geçiş isteği ana ekrana döner veya yok sayılır

### Paket 04 - Regresyon Kapsamı

Amaç:

- Parent panel kontrol davranışının tekrar kırılmasını zorlaştırmak

Kapanış ölçütü:

- görünürlük normalizasyonu unit testle doğrulanır
- Parent panelden mod gizleme ve tümünü kapatma guard'ı Playwright e2e ile doğrulanır
- build, lint, unit ve e2e hattı temiz geçer

## Faz Kapanışı

Bu faz, Parent panel aktif MVP mod görünürlüğünü local-first olarak yönetebildiğinde ve çocuk yüzeyi gizlenen modları güvenli biçimde uzak tuttuğunda kapanır.

Kapanış durumu:

- tamamlandı

Doğrulama:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e`
- canlı tarayıcı DOM kontrolü
