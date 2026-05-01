---
name: implementation-start
description: MinaPlay içinde gerçek dosya veya kod üretimine geçmeden önce hangi bağlamın okunacağını, neyin netleştirileceğini ve implementasyona hangi eşiği geçince başlanacağını tanımlar.
created: 2026-04-17
updated: 2026-05-01
---

# Implementation Start

Bu workflow, `MinaGrow` üst bağlamındaki `MinaPlay` içinde aktif uygulama veya doküman düzenleme işine başlamadan önce ajanın nasıl hizalanacağını tanımlar.

## Ne Zaman Kullanılır?

- kullanıcı kod değişikliği isterse
- kullanıcı `.meta` veya `.agent` düzenlemesi isterse
- `Konusu-Yorum` referansından bir davranış taşınacaksa
- kanonik V2 uygulama workspace'inde uygulama kurulacaksa
- PWA modülü geliştirilecekse
- Pofi davranış sistemi, Parent panel analizi veya yeni modül mimarisi etkileniyorsa
- test/doğrulama çalışması yapılacaksa

## İlk Ayrım

Önce işin türü ayrılır:

- meta güncelleme
- agent güncelleme
- uygulama kodu
- ürün/UX düzenlemesi
- Pofi davranış/state düzenlemesi
- Parent panel analiz/kontrol düzenlemesi
- taşıma veya temizlik
- test/doğrulama

Bu ayrım yapıldıktan sonra yalnız ilgili dosyalar okunur.

## Okuma Sırası

Genel başlangıç:

1. `.meta/project.md`
2. `.meta/architecture.md`
3. `.meta/data-model.md`
4. `.meta/web.md`
5. `.meta/plan.md`
6. `.agent/context/profile.md`
7. `.agent/context/business.md`
8. `.agent/context/collaboration.md`

Kod veya davranış gerekiyorsa:

1. `/Users/umitaydin/Documents/Konusu-Yorum/README.md`
2. `/Users/umitaydin/Documents/Konusu-Yorum/progress.md`
3. ilgili `src/modules/*` dosyası
4. ilgili `public/*` dosyası
5. ilgili test dosyası

## Uygulamaya Geçiş Eşiği

Uygulamaya geçmek için aşağıdakilerden biri yeterlidir:

- kullanıcı açıkça "düzenle", "uygula", "yaz", "değiştir", "taşı" demiştir
- iş daha önce netleştirilmiş aktif hedefin devamıdır
- kullanıcı doğrudan hata veya test kırığını düzeltmeyi istemiştir

Eğer kullanıcı yalnız değerlendirme istediyse dosya değiştirilmez.

## Tek Hedef Kuralı

Aynı anda tek aktif kapanış hedefi korunur.

Örnek hedefler:

- meta/agent hizalamasını kapat
- Konusu-Yorum kodunu MinaPlay içine taşı
- hikaye modülü bug'ını düzelt
- PWA offline fallback ekle
- legacy webhook parçalarını ayır

## Kod Değişikliği Doğrulaması

Kod değişikliği yapıldıysa uygun olduğunda şu komutlar tercih edilir:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e`

Komutlar, gerçek uygulama klasöründe çalıştırılır.

Bugünkü çalışan referans:

- `/Users/umitaydin/Documents/Konusu-Yorum`

Hedef uygulama alanı:

- `.meta/plan.md` ve `.meta/project.md` içindeki kanonik hedef okunur
- bugünkü V2 hedefi: `/Users/umitaydin/Documents/Studio-workspace-Project`
- `/Users/umitaydin/Documents/MinaGrow/MinaPlay` varsa eski/ara çalışma izi, karşılaştırma veya geçici referans olarak değerlendirilir

## Kayıt

Anlamlı kapanıştan sonra:

- `.meta/worklog.md` güncellenir
- agent davranışı değiştiyse `.agent/worklog.md` güncellenir
- açık riskler varsa `.meta/notes.md` güncellenir

## Kısa Kural

Bağlamı oku, tek hedef seç, uygula, doğrula, kaydet.
