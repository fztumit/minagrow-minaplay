---
name: plan
description: MinaPlay projesinin bugünkü yürütme yönünü, aktif odağını ve yakın çalışma sırasını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Plan

## Aktif Odak

Bugünkü aktif odak:

`MinaPlay` ürün hafızasını Pofi davranış sistemi, 0-5 başlangıç odağı, 0-18 uzun vadeli vizyonu ve yeni bilgi mimarisiyle hizalamak.

Bu odak, eski hazır bağlamdan ve eski karakter/ürün adlarından kalan belirsizlikleri kaldırır. Çalışan `Konusu-Yorum` referansı korunur, ama kanonik ürün yönü `MinaPlay + Pofi` olarak netleşir.

## Bugünkü Kapanış Hedefi

- ürün adı `MinaPlay` olarak netleşecek
- başlangıç ürün odağı 0-5 konuşma, taklit, duygu ve etkileşim desteği olarak yazılacak
- uzun vadeli vizyon 0-18 yaş, okul öncesi, örgün öğretim, gönüllü eğitimci ağı ve engelli bireylerin okul süreci desteği olarak ayrılacak
- Pofi süs karakteri değil davranışsal etkileşim sistemi olarak tanımlanacak
- 6 ana mod + Ceee bonus mimarisi meta dosyalarına işlenecek
- Parent panel analiz, kontrol ve izleme rolüyle netleşecek
- gelecek terapist/eğitimci ve raporlama vizyonu bugünkü çekirdekten ayrılacak

## Kanonik Ürün Yönü

Başlangıç çekirdeği:

- 0-5 yaş
- konuşma desteği
- taklit
- duygu ve etkileşim
- sakin, yumuşak, düşük uyarımlı PWA deneyimi

İlerleyen seviyeler:

- 0-18 yaş aralığına genişleme
- okul öncesi destek
- örgün öğretim desteği
- engelli bireylerin okul sürecinde desteklenmesi
- gönüllü eğitimci ağı
- ebeveyn, terapist, eğitimci ve okul destek aktörleri arasında kontrollü ağ

## Bilgi Mimarisi

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

Analiz adayları:

- hangi bölümde ne oynandı
- neler yapıldı
- doğru denemeler
- yanlış veya hedef dışı denemeler
- tamamlanan egzersizler
- tekrar sayısı
- oturum sıklığı

Kontrol adayları:

- kullanım limitleri
- modül kontrolü
- screen lock

Çocuk şunları yapamamalıdır:

- modülden kontrolsüz çıkış
- dış uygulama açma
- ayar değiştirme

## Yakın Sıra

### 1. Meta Kanon Hizalaması

Durum:

- aktif

Kapanış ölçütü:

- `.meta` içinde eski yaş aralığı ifadesinin kalmaması
- Pofi'nin yalnız süs karakteri gibi tanımlanmaması
- 6 ana mod + Ceee ayrımının netleşmesi
- 0-5 çekirdek ile 0-18 gelecek vizyonunun karışmaması
- Parent panel analiz ve kontrol rolünün görünür olması

### 2. Kod Taşıma Planı

Amaç:

- `/Users/umitaydin/Documents/Konusu-Yorum` içindeki çalışan uygulamayı `/Users/umitaydin/Documents/MinaGrow/MinaPlay` alanına taşıma yöntemini netleştirmek

Karar gerektirenler:

- Git geçmişi korunacak mı
- mevcut `node_modules`, `dist`, `output`, `test-results` taşınacak mı
- Railway deploy yeni klasör yapısına göre nasıl güncellenecek
- storage key adları korunacak mı
- Pofi asset ve state sistemi nasıl taşınacak

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
