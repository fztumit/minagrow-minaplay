---
name: phase-07
description: MinaPlay içinde güvenli ses/video kayıt ve dış medya linki yönetimini tanımlar.
created: 2026-06-26
updated: 2026-08-03
---

# Phase 07 - Güvenli Medya ve Kayıt

## Amaç

Bu fazın amacı, ebeveynin Dokun odak tekrarında kısa ses veya video modeli ekleyebilmesini sağlamak ve dış platform linklerini güvenli sınırlarla saklamaktır.

Faz 7 medya yüklemeyi çocuk yüzeyine otomatik taşımaz. Kayıt, önizleme, silme ve link ekleme ebeveyn panelinde kalır. Çocuk yüzeyinde medya kullanımı ancak ayrı güvenli davranış kuralı kapandıktan sonra açılır.

## Kapsam

Dahil:

- Parent panel Düzenle sekmesinde seçili odak kelime için kısa ses kaydı almak
- Parent panel Düzenle sekmesinde seçili odak kelime için kısa video kaydı almak
- kayıtları ve dış linkleri localStorage yerine IndexedDB üzerinde şifreli medya kasasında local-first saklamak
- kayıtları Parent panelde önizlemek ve silebilmek
- YouTube, Vimeo, Drive veya benzeri platformlardan güvenli `https` linki saklamak
- kamera/mikrofon izin hatalarını sakin ebeveyn mesajıyla göstermek
- kayıt sürelerini kısa tutmak

Hariç:

- uygulama içinden YouTube veya başka platforma yükleme yapmak
- bulut depolama veya çok cihazlı medya senkronu
- çocuğa otomatik video oynatmak
- medya içerik moderasyonu iddiası
- uzun video arşivi veya galeri sistemi
- terapist/eğitimci medya paylaşımı

## İş Paketleri

### Paket 01 - Parent Panel Kısa Kayıt

Amaç:

- ebeveynin odak kelime için kısa ses/video modeli kaydedebilmesini ve dış link ekleyebilmesini sağlamak

Kapanış ölçütü:

- Odak tekrar bloğunda ses/video linki alanı bulunur
- ses kaydı başlat/durdur kontrolü görünür
- video kaydı başlat/durdur kontrolü görünür
- kayıtlar kelimeye bağlı olarak IndexedDB içinde saklanır
- medya kasası açılmadan link girilemez, kayıt başlatılamaz veya önizleme görülemez
- kayıtlar ve dış linkler PBKDF2 + AES-GCM ile şifrelenmiş payload içinde tutulur
- tekrar ayarlarının düz localStorage payload'ında dış medya linki saklanmaz
- kayıtlar Parent panelde önizlenir ve silinebilir
- dış linkler `http/https` olarak normalize edilir
- çocuk yüzeyinde otomatik medya oynatma açılmaz

Durum:

- tamamlandı

Kapanış sonucu:

- ses kaydı en fazla 10 saniyeyle, video kaydı en fazla 12 saniyeyle sınırlandı
- medya kasası şifreyle oluşturulur; şifre cihazda düz metin olarak saklanmaz
- kasa kilitliyken medya linki alanı ve kayıt kontrolleri pasif kalır
- MediaRecorder desteklenmeyen veya izin verilmeyen cihazlarda ebeveyne sakin durum mesajı gösterilir
- YouTube gibi dış platformlar için uygulama yükleme yapmaz; ebeveyn dış linki kaydeder
- build, lint, 34 unit test, 31 Playwright e2e ve masaüstü/telefon görsel QA geçti

### Paket 02 - Çocuk Akışında Güvenli Kullanım Kuralı

Amaç:

- kaydedilen ses/video modelinin çocuk tekrar akışında ne zaman ve nasıl kullanılacağını belirlemek

Kapanış ölçütü:

- ses kaydı çocuk yüzeyinde yalnız ebeveynin açık seçimiyle kullanılır
- video kaydı çocuk yüzeyinde otomatik başlamaz
- medya oynatma süresi, ses seviyesi ve tekrar davranışı düşük uyarımlı kalır
- medya yoksa mevcut TTS/kayıtlı ses fallback akışı bozulmaz

Durum:

- tamamlandı

Kapanış sonucu:

- Parent panelde `Çocuk tekrarında ebeveyn sesini kullan` seçeneği eklendi
- bu seçenek medya kasası kapalıyken pasif kalır
- ebeveyn sesi yalnız Dokun odak tekrar akışında, kasa açıkken, seçenek açıksa ve ilgili kelime için ses kaydı varsa kullanılır
- video kaydı çocuk ekranında otomatik başlamaz; Parent panel önizlemesinde kalır
- medya yoksa mevcut kayıtlı ses/TTS fallback akışı korunur
- gizlilik notu Parent panel medya alanına eklendi
- build, lint, 34 unit test, 31 Playwright e2e ve masaüstü/telefon görsel QA geçti

### Paket 03 - Şifreli Yedek ve Cihaz QA

Amaç:

- şifre unutma riskinde arka kapı açmadan aile kayıtlarını koruyacak yedek yaklaşımını ve gerçek cihaz kontrol listesini belirlemek

Kapanış ölçütü:

- medya kasası için arka kapısız güvenlik kararı korunur
- şifre unutulursa kayıtların açılamayacağı açık metinle anlatılır
- şifreli yedek/dışa aktarma kapsamı netleşir
- iOS Safari, Android Chrome ve masaüstü Chrome için kamera/mikrofon/MediaRecorder manuel QA checklist'i hazırlanır

Durum:

- tamamlandı

Kapanış sonucu:

- medya kasasının mevcut AES-GCM şifreli zarfını düz medya veya kasa şifresi eklemeden JSON yedeğe aktaran akış eklendi
- yedek, başka cihazda aynı kasa şifresiyle açılmak üzere Parent panelden içe aktarılabilir hale geldi
- içe aktarma mevcut kasayı ebeveyn onayı olmadan değiştirmez
- hatalı, düz veya beklenmeyen yedek yükleri reddedilir; yedek boyutu 128 MB ile sınırlandırılır
- Android uygulama/Chrome, iOS Safari/PWA ve masaüstü Chrome için `docs/media-vault-device-qa.md` kontrol listesi hazırlandı
- build, lint, 45 unit test ve odak Playwright dışa/içe aktarma senaryosu geçti

## Aktif Kapanış Hedefi

Faz 7 tamamlandı. Bir sonraki aktif hedef yeni ürün/faz kararı olarak ayrıca açılmalıdır; gerçek cihaz kontrol listesi sürüm adayı hazırlanırken uygulanır.

## Kısa Kural

Medya ebeveyn aracıdır; çocuk yüzeyine ancak kontrollü, kısa ve düşük uyarımlı biçimde geçer.
