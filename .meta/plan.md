---
name: plan
description: MinaPlay projesinin bugünkü yürütme yönünü, aktif odağını ve yakın çalışma sırasını tanımlar.
created: 2026-04-17
updated: 2026-04-19
---

# Plan

## Aktif Odak

Bugünkü aktif odak:

`MinaPlay V2` ürün anayasasını yazılı hafızaya geçirmek ve MVP kapsamını netleştirmek.

Bu odak, V1'i uygulama temeli olarak taşımayı bırakır. V1 yalnız fikir, davranış ve örnekleme referansı olarak kalır. V2 tamamen yeni bir ürün versiyonu olarak kurulacaktır.

## Bugünkü Kapanış Hedefi

- MinaPlay V2'nin tamamen yeni ürün versiyonu olduğu yazılı hafızaya işlenecek
- V1 yalnız fikir, davranış ve örnekleme referansı olarak konumlanacak
- ürün iddiası klinik tedavi yerine geçmeyen ev pratiği/dijital oyun arkadaşı çizgisinde netleşecek
- pasif ekran kullanımı problemi özel marka adı kullanılmadan yazılacak
- Pofi state sistemi yanında presence sistemiyle tanımlanacak
- çocuk ekranı, Parent panel, renk/hareket güvenliği ve MVP kapsam anayasaları görünür olacak
- başarı ölçütleri teknik çıktılardan çok davranışsal ve duygusal başarıya bağlanacak

## Kanonik Ürün Yönü

Başlangıç çekirdeği:

- 0-5 yaş
- konuşma desteği
- taklit
- duygu ve etkileşim
- dikkat pratiği
- pasif ekran kullanımına alternatif aktif oyun/öğrenme deneyimi
- sakin, yumuşak, düşük uyarımlı PWA deneyimi

İlerleyen seviyeler:

- 0-18 yaş aralığına genişleme
- okul öncesi destek
- örgün öğretim desteği
- engelli bireylerin okul sürecinde desteklenmesi
- gönüllü eğitimci ağı
- ebeveyn, terapist, eğitimci ve okul destek aktörleri arasında kontrollü ağ

## MVP Bilgi Mimarisi

Aktif MVP modları:

- Ana ekran
- Dokun: `view-touch`
- Eşleme: `view-match`
- Ayna: `view-mirror`
- Uyku: `view-sleep`
- Parent panel: `view-parent`

MVP dışı veya pasif modlar:

- Cümle: `view-sentence`
- Hikaye: `view-story`
- Ceee: `view-peekaboo`
- gelişmiş ebeveyn analizleri

MVP sürecinde yeni mod eklemek, mevcut modları büyütmek veya kapsamı genişletmek yerine stabilite, tutarlılık ve kullanıcı hissi öncelenir.

## Tam Ürün Bilgi Mimarisi

Ana modlar:

- Dokun: `view-touch`
- Eşleme: `view-match`
- Cümle: `view-sentence`
- Hikaye: `view-story`
- Ayna: `view-mirror`
- Uyku: `view-sleep`

Bonus:

- Ceee: `view-peekaboo`

Destek katmanı:

- Parent panel: `view-parent`

## Parent Panel Yönü

Parent panel çocuk yüzeyinden ayrı katmandır.

Roller:

- kontrol
- izleme
- içerik ve kayıt yönetimi
- kullanım analizi
- yorumlanmış rehberlik
- ebeveynin yeni kelime, cümle veya tekrar ihtiyacını anlamasını sağlama

Analiz adayları:

- hangi bölümde ne oynandı
- neler yapıldı
- doğru denemeler
- yanlış veya hedef dışı denemeler
- tamamlanan egzersizler
- tekrar sayısı
- oturum sıklığı
- kayıt durumu
- tekrar ihtiyacı
- kısa öneri

Kontrol adayları:

- kullanım limitleri
- modül kontrolü
- screen lock

Çocuk şunları yapamamalıdır:

- modülden kontrolsüz çıkış
- dış uygulama açma
- ayar değiştirme

## Yakın Sıra

### 1. V2 Ürün Anayasası

Durum:

- aktif

Kapanış ölçütü:

- `.meta` içinde V2'nin tamamen yeni versiyon olduğu görünür
- V1'in yalnız fikir/davranış referansı olduğu görünür
- Pofi presence seviyeleri yazılıdır
- çocuk ekranı ve Parent panel anayasaları görünürdür
- MVP aktif/pasif mod ayrımı nettir

### 2. V2 Tasarım Sistemi

Amaç:

- Pofi Sahnesi yaklaşımını, renk/hareket güvenlik kurallarını, ana ekran gridini ve mod ekran kalıplarını uygulamaya hazır hale getirmek

Karar gerektirenler:

- token adları
- Pofi presence ölçüleri ve üst sınırları
- aktif/pasif kart davranışı
- Parent panel görsel ayrımı
- mobil/tablet kırılımları

### 3. Ürün Sertleştirme

Amaç:

- mobil/tablet Playwright görsel kontrolleri
- service worker offline fallback
- mikrofon, kamera ve TTS fallback metinleri
- localStorage ses kaydı kapasite stratejisi
- Parent panel analizlerinin local-first sınırları
- Pofi state çakışması kontrolleri

## Şimdilik Açılmayacaklar

- kullanıcı hesabı
- cloud sync
- ödeme/abonelik
- gerçek terapist dashboard'u
- gönüllü eğitimci ağı uygulaması
- okul/kurum yönetim paneli
- çok dilli içerik sistemi
- büyük backend veri modeli

## Kapanış Disiplini

Her aktif iş şu sırayla kapanır:

1. bağlam oku
2. tek hedef belirle
3. uygula
4. mümkünse doğrula
5. worklog güncelle
6. gerekiyorsa commit
