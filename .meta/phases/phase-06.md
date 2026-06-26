---
name: phase-06
description: MinaPlay içinde İfade ve Hikaye aktivasyonunu, Dokun odak tekrarını ve Parent panel sadeleştirmesini tanımlar.
created: 2026-06-25
updated: 2026-06-26
---

# Phase 06 - İfade ve Hikaye Aktivasyonu

## Amaç

Bu fazın amacı, Faz 5 sonunda sertleşen MVP çocuk yüzeyine İfade ve Hikaye modlarını kontrollü biçimde almak, Ceee'yi bonus/kısa dikkat oyunu olarak korumak ve Parent paneli artan içerik yoğunluğuna rağmen hızlı okunur tutmaktır.

Faz 6 yeni bir backend, hesap sistemi veya bulut senkronu açmaz. Çocuk yüzeyindeki genişleme local-first sınırda, Pofi davranış sistemi ve Parent panel kontrol katmanı korunarak yapılır.

## Kapsam

Dahil:

- İfade modunu `view-sentence` üzerinden çocuk yüzeyinde aktif göstermek
- Hikaye modunu `view-story` üzerinden çocuk yüzeyinde aktif göstermek
- Parent panel mod görünürlüğü kontrolünü İfade ve Hikaye ile genişletmek
- Dokun modunda ebeveynin Baba gibi odak kelimeyi tekrar akışına alabilmesini sağlamak
- tekrar tarzı, video/çekim linki ve çekim notunu local-first ayar olarak tutmak
- Parent paneli Bugün, Düzenle ve Kontrol sekmelerine ayırarak ilk ekranı sade tutmak
- genişleyen kart/görsel seti ve cache versiyonlarını test kapsamıyla korumak

Hariç:

- video dosyası yükleme veya uygulama içinde video oynatma
- bulut hesabı, çok cihazlı senkron veya uzak ebeveyn kontrolü
- terapist/eğitimci paneli
- klinik/tıbbi yönlendirme dili
- yeni ana çocuk modu eklemek
- Parent paneli uzun rapor veya performans puanı yüzeyine çevirmek

## İş Paketleri

### Paket 01 - İfade ve Hikaye Yüzeyi

Amaç:

- İfade ve Hikaye modlarını ana ekran ve alt navigasyonda aktif, Ceee'yi bonus olarak konumlandırmak

Kapanış ölçütü:

- ana ekranda Dokun, Eşleme, İfade, Hikaye, Ayna ve Uyku ana modları görünür
- Ceee bonus/kısa dikkat oyunu olarak kalır
- Parent panel görünürlük kontrolü İfade ve Hikaye için de çalışır

### Paket 02 - Dokun Odak Tekrarı

Amaç:

- ebeveynin belirli bir kelimeyi sıkıcı düz döngüye düşmeden tekrar ettirebilmesini sağlamak

Kapanış ölçütü:

- varsayılan odak Baba kelimesidir
- tekrar tarzı melodik, oyunlu veya sakin seçilebilir
- video/çekim linki ve çekim notu yerel ayarda saklanır
- çocuk yüzeyinde tekrar kontrolü görünmez; kontrol Parent panelde kalır

### Paket 03 - Parent Panel Sadeleştirme

Amaç:

- artan mod ve içerik yoğunluğunu ebeveynin hızlı okuyabileceği sekmeli yapıya almak

Kapanış ölçütü:

- Bugün sekmesi ilk açılışta özet, yorum ve hızlı aksiyonları gösterir
- Düzenle sekmesi içerik, tekrar ve öğrenme detaylarını taşır
- Kontrol sekmesi çocuk kilidi, mod görünürlüğü ve cihaz tercihlerini taşır

### Paket 04 - Regresyon ve Meta Hizalama

Amaç:

- Faz 6 sonrası test beklentilerini ve proje hafızasını gerçek uygulama davranışıyla hizalamak

Kapanış ölçütü:

- genişleyen 33 kartlık Dokun seti Playwright beklentileriyle uyumludur
- cache query taşıyan görseller e2e testlerde kırılmaz
- build, lint, unit ve Playwright e2e hattı temiz geçer
- `project`, `architecture`, `plan`, `phase-06` ve `worklog` Faz 6 gerçekliğini aynı dille taşır

### Paket 05 - Bugün Sekmesi Rehberlik Dili

Amaç:

- ebeveynin Bugün sekmesine göz ucuyla bakınca ne olduğunu ve ne yapacağını anlamasını sağlamak

Kapanış ölçütü:

- ham oturum/doğru/yönlendirme/tekrar dili yerine gün ritmi, bağımsız deneme, destekle deneme ve tekrar odağı dili kullanılır
- bölüm bazlı kullanım mini bar grafikleriyle görünür
- önerilen kelimeler bilişsel seviye ve normal dil gelişimi önceliğine göre sıralanır
- gelişim yorumu özel eğitim/rehber öğretmen diliyle ebeveyne neyi nasıl destekleyeceğini anlatır
- detay alanı ham paragraf listesi yerine bölüm satırı, mini bar ve bağımsız/destekli ayrımı taşır

### Paket 06 - Düzenle ve Kontrol Yoğunluğunu Azaltma

Amaç:

- Düzenle ve Kontrol sekmelerindeki uzun tablo ve ayar kalabalığını açılır çalışma bloklarıyla azaltmak

Kapanış ölçütü:

- Düzenle sekmesinde odak tekrar, Dokun kartları, Dokun öğrenme ve Eşleme öğrenme ayrı bloklar halinde görünür
- Kontrol sekmesinde çocuk profili, çocuk kilidi, mod görünürlüğü, Ayna, Uyku ve cihaz durumu ayrı bloklar halinde görünür
- varsayılan açık blok ebeveynin en sık ihtiyaç duyduğu aksiyon olur; hızlı aksiyonlar hedef bloğu otomatik açar
- Bugün sekmesi sade kalır

Durum:

- tamamlandı

Kapanış sonucu:

- Düzenle sekmesi odak tekrar bloğunu açık başlatır; kart listesi ve öğrenme tabloları ayrı katlanır bloklarda kalır
- Kontrol sekmesi çocuk profiliyle sakin açılır; güvenlik, mod görünürlüğü, Ayna, Uyku ve cihaz durumu ayrı bloklara ayrılmıştır
- kapalı blok içindeki hedefe giden hızlı aksiyonlar ilgili bloğu açıp hedef kontrole odaklanır
- mobil Düzenle sekmesinde iki kolon çakışması giderilmiştir
- build, lint, 34 unit test, 31 Playwright e2e ve masaüstü/telefon görsel QA geçmiştir

### Paket 07 - Faz 6 Kapanış QA ve Medya Kapsamı

Amaç:

- Faz 6'nın ürün yüzeyini yayıma yakın kaliteyle son kez taramak ve video/yükleme gibi güvenli medya işlerinin bu fazda mı yoksa ayrı fazda mı ele alınacağını netleştirmek

Kapanış ölçütü:

- Parent panel Bugün, Düzenle ve Kontrol sekmeleri masaüstü ve telefon genişliklerinde yatay taşma veya okunabilirlik sorunu üretmez
- İfade, Hikaye, Dokun tekrar ve mod görünürlüğü regresyonları tam kalite hattında korunur
- video/link/yükleme sınırı ürün güvenliği açısından net karar metnine bağlanır
- Faz 6 sonrası sıradaki faz veya kapanış kararı plan yüzeyine işlenir

Durum:

- tamamlandı

Kapanış sonucu:

- Bugün, Düzenle ve Kontrol sekmeleri 1440x1000 masaüstü ve 390x844 telefon genişliklerinde ekran görüntüsü ve yatay taşma ölçümüyle doğrulandı
- Düzenle sekmesi iki kolon yerine tek sütun akışa geri alındı
- İfade, Hikaye, Dokun tekrar, Parent panel öğrenme satırları, Ayna/Uyku tercihleri, mod görünürlüğü ve Pofi katman davranışı tam Playwright hattında korundu
- `npm run build`, `npm run lint`, 34 unit test ve 31 Playwright e2e testi 2026-06-26 kapanışında geçti
- video dosyası yükleme, uygulama içi video oynatma ve güvenli medya yönetimi Faz 6 dışında ayrı paket/faz olarak bırakıldı

## Aktif Kapanış Hedefi

Faz 6 tamamlandı. Sonraki aktif hedef, güvenli medya/yükleme kapsamını veya yeni faz yönünü ayrı karar olarak açmaktır.

## Kısa Kural

Faz 6 çocuk yüzeyini büyütürken ürünü gürültülü hale getirmez.

İfade ve Hikaye aktifleşir; Ceee bonus kalır; Parent panel ilk ekranı sade kalır.
