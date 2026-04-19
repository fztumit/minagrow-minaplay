---
name: plan
description: MinaPlay projesinin bugünkü yürütme yönünü, aktif odağını ve yakın çalışma sırasını tanımlar.
created: 2026-04-17
updated: 2026-04-19
---

# Plan

## Aktif Odak

Bugünkü aktif odak:

`MinaPlay V2` ürün anayasasını, teknik kurulum sırasını ve MVP kapsamını yazılı hafızaya geçirmek.

Bu odak, V1'i uygulama temeli olarak taşımayı bırakır. V1 yalnız fikir, davranış ve örnekleme referansı olarak kalır. V2 tamamen yeni bir ürün versiyonu olarak kurulacaktır.

## Bugünkü Kapanış Hedefi

- MinaPlay V2'nin tamamen yeni ürün versiyonu olduğu yazılı hafızaya işlenecek
- V1 yalnız fikir, davranış ve örnekleme referansı olarak konumlanacak
- ürün iddiası klinik tedavi yerine geçmeyen ev pratiği/dijital oyun arkadaşı çizgisinde netleşecek
- pasif ekran kullanımı problemi özel marka adı kullanılmadan yazılacak
- Pofi state sistemi yanında presence sistemiyle tanımlanacak
- Pofi'nin tek global instance, merkezi `pofi-root`, event temelli modül iletişimi ve idle timer kuralı görünür olacak
- çocuk ekranı, Parent panel, renk/hareket güvenliği ve MVP kapsam anayasaları görünür olacak
- Parent Panel MVP kelime/nesne istatistikleri, günlük özet, öğrenildi kuralı ve set seçimiyle sınırlandırılacak
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

Parent Panel MVP sınırı:

- kelime/nesne bazlı deneme sayısı
- doğru sayısı
- ardışık doğru sayısı
- son 5 deneme özeti
- öğrenildi durumu
- günlük kısa özet
- temel set seçimi

MVP öğrenildi kuralı:

- son 5 denemede en az 4 doğru
- ardışık doğru sayısı en az 3

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
- tablet ana ekranda ilk 4 aktif kart 2x2, Ceee geniş alt kart olarak tasarlanır
- mobil yatayda alan genişliğine göre 2-3 kolon kullanılabilir
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
- Dokun modunda Pofi aktif kartın üst alanına bağlanır; yalnız aktif kart animasyon taşır
- Eşleme modunda sol hedef ve sağda 3 seçenek kullanılır
- Eşleme modunda Pofi solda bekler; 5-10 saniye sonra doğru kartı yumuşak biçimde hatırlatır
- bir nesne için öğrenildi kuralı son 5 denemede en az 4 doğru ve ardışık doğru sayısının en az 3 olmasıdır
- Ayna modunda duygu/mimik, dil, dudak ve yüz egzersizleri Parent panel sırasına göre ilerler
- Ayna modunda Pofi solda büyük ve erişilebilir görünür; sağda ayna alanı bulunur
- kamera varsa ölçüm yapılabilir, kamera yoksa görsel anlatım ve süre/tekrar akışı çalışır
- Uyku modunda ses, süre ve kayıt ebeveyn tarafından belirlenir; touch lock ve özel çıkış gesture'ı kullanılır
- Uyku modunda Pofi kaybolmaz; bulut gibi sakin görünür, ay ve Pofi doğal ve çok yavaş hareket eder
- Ceee temiz PNG tarzı çocuk odası ortamında Pofi'nin saklanma, merkeze gelme, yeniden konumlanma ve otomatik devam etme davranışını taşır
- Parent panel kelime, cümle, hikaye, ses, resim, egzersiz sırası ve uyku tercihlerini planlama alanı olarak ele alır

### 5. Pofi Presence Matrisi

Amaç:

- Pofi'nin sabit karakter gibi değil, duruma göre sahneye giren ve sonra geri çekilen canlı ama sakin rehber gibi davranmasını sağlamak

Alınan kararlar:

- tüm MVP modlarında presence sistemi kullanılır: gizli, hafif, normal, odak, sahne
- Dokun: başlangıç hafif -> normal, hedefte odak, doğru cevapta kısa sahne, yanlışta normal, beklemede odak
- Eşleme: başlangıç hafif, hedefte odak, doğru eşlemede kısa sahne, yanlışta normal, beklemede odak
- Ayna: başlangıç normal, egzersiz/taklit sırasında odak, yapamazsa normal, tamamlanınca kısa sahne
- Uyku: başlangıç hafif, uyku aktifken bulut gibi hafif, etkileşimlere tepki yok
- sahne seviyesi yalnız kısa ödül anlarında 300-500 ms kullanılır
- tüm geçişler yumuşaktır; aynı anda tek duygu ve tek yüz görünür

### 6. V2 Teknik Kurulum Sırası

Amaç:

- V2'yi baştan kurarken her parçayı stabil hale getirip sonra bir sonrakine geçmek

Sıra:

1. Pofi core sistemi: state, presence ve idle timer
2. Ana ekran
3. Dokun modülü
4. Eşleme modülü
5. Ayna modülü
6. Uyku modülü
7. Ceee modülü

Kurallar:

- her modül stabil olmadan sonraki modül büyütülmez
- modüller Pofi'yi doğrudan yönetmez; yalnız olay gönderir
- Pofi merkezi `pofi-root` içinde tek instance olarak render edilir
- stage davranışı 400 ms sabit kabul edilir ve otomatik normale döner

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
