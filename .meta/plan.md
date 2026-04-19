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
- Ceee: `view-peekaboo`
- Parent panel: `view-parent`

MVP dışı veya pasif modlar:

- Cümle: `view-sentence`
- Hikaye: `view-story`
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

Kısa dikkat oyunu:

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

Alınan kararlar:

- ana arka plan `#F7F9FB` çizgisinde yumuşak açık zemin olmalıdır
- kartlar beyaz veya beyaza yakın yüzey üzerinde çok hafif pastel ton taşır
- kart aksanları turkuaz, açık yeşil, pembe, mor/lilac, açık gök mavisi ve yumuşak sarı ailesinde kalır
- kart içinde ikon sol tarafta belirgin, metin orta/ana alanda sade, Pofi sağ altta küçük yardımcıdır
- Pofi `odak` seviyesinde yaklaşık 1.3x-1.6x, `sahne` seviyesinde en fazla 3x büyüyebilir
- tablet ana ekran aktif MVP kartlarında 2x2 grid, mobilde tek kolon liste kullanır
- mod ekranları üst yönlendirme, orta görev alanı, sağ alt Pofi ve alt kısa geri bildirim kalıbını paylaşır
- Parent panel nötr renkli, az animasyonlu, düzenli ve yorum odaklı olmalıdır

### 3. Ürün Sertleştirme

Amaç:

- mobil/tablet Playwright görsel kontrolleri
- service worker offline fallback
- mikrofon, kamera ve TTS fallback metinleri
- localStorage ses kaydı kapasite stratejisi
- Parent panel analizlerinin local-first sınırları
- Pofi state çakışması kontrolleri

### 4. MVP Ekran Akışları

Amaç:

- Ana ekran, Dokun, Eşleme, Ayna, Uyku ve Ceee için çocuk akışını, Pofi davranışını ve Parent panel kayıtlarını uygulamaya hazır hale getirmek

Alınan kararlar:

- ana ekranda aktif alanlar Dokun, Eşleme, Ayna, Uyku ve Ceee'dir
- Cümle ve Hikaye MVP'de gizli veya "yakında" durumunda kalır
- Dokun modunda hedefler dengeli dağıtılır; 30 saniye tepkisizlik Pofi dikkat akışını tetikler
- Eşleme modunda sol hedef ve sağda 3 seçenek kullanılır
- bir nesne için üst üste 10 doğru cevap öğrenildi kabul edilir
- Ayna modunda duygu/mimik, dil, dudak ve yüz egzersizleri Parent panel sırasına göre ilerler
- kamera varsa ölçüm yapılabilir, kamera yoksa görsel anlatım ve süre/tekrar akışı çalışır
- Uyku modunda ses, süre ve kayıt ebeveyn tarafından belirlenir; touch lock ve özel çıkış gesture'ı kullanılır
- Parent panel kelime, cümle, hikaye, ses, resim, egzersiz sırası ve uyku tercihlerini planlama alanı olarak ele alır

### 5. Pofi Presence Matrisi

Amaç:

- Pofi'nin sabit karakter gibi değil, duruma göre sahneye giren ve sonra geri çekilen canlı ama sakin rehber gibi davranmasını sağlamak

Alınan kararlar:

- tüm MVP modlarında presence sistemi kullanılır: gizli, hafif, normal, odak, sahne
- Dokun: başlangıç hafif -> normal, hedefte odak, doğru cevapta kısa sahne, yanlışta normal, beklemede odak
- Eşleme: başlangıç hafif, hedefte odak, doğru eşlemede kısa sahne, yanlışta normal, beklemede odak
- Ayna: başlangıç normal, egzersiz/taklit sırasında odak, yapamazsa normal, tamamlanınca kısa sahne
- Uyku: başlangıç hafif, uyku aktifken gizli veya yok gibi, etkileşimlere tepki yok
- sahne seviyesi yalnız kısa ödül anlarında 300-500 ms kullanılır
- tüm geçişler yumuşaktır; aynı anda tek duygu ve tek yüz görünür

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
