---
name: plan
description: MinaPlay projesinin bugünkü yürütme yönünü, aktif odağını ve yakın çalışma sırasını tanımlar.
created: 2026-04-17
updated: 2026-08-03
---

# Plan

## Aktif Odak

Bugünkü aktif odak:

`MinaPlay V2` için kanonik uygulama hedefi olan `/Users/umitaydin/Documents/MinaGrow/MinaPlay` içindeki çalışan ürün omurgasını kararlı, doğrulanabilir ve yayıma hazır hale getirmek.

Bu odak, V1'i uygulama temeli olarak taşımayı bırakır. V1 yalnız fikir, davranış ve örnekleme referansı olarak kalır. V2'nin kanonik kodu `MinaGrow/MinaPlay` içinde geliştirilir.

Önceki planda yer alan `/Users/umitaydin/Documents/Studio-workspace-Project` hedefi artık geçerli değildir. Bu klasör mevcut değildir ve aktif çalışma hedefi olarak kullanılmaz.

## Faz 1 - Kanonik Hedef ve Stabilizasyon

Durum:

- tamamlandı

Kapanan paketler:

- 1-1: `/Users/umitaydin/Documents/MinaGrow/MinaPlay` kanonik uygulama hedefi olarak kesinleştirildi
- 1-2: mevcut uygulama değişiklikleri ve test kapsamı tek paket olarak gözden geçirildi
- 1-3: build, lint, unit ve e2e kalite hattı bağımsız olarak doğrulandı
- 1-4: masaüstü, tablet ve telefon responsive kontrolleri tamamlandı; mobil taşmalar giderildi
- 1-5: plan, worklog ve git kapanışı tamamlandı

Kapanış sonucu:

- plan, agent bağlamı ve çalışan kod aynı uygulama alanını işaret eder
- ana uygulama kalite hattı kararlıdır
- mobil ana ekran için yatay taşma regresyon testi vardır
- Faz 1 değişiklikleri tek git kapanışında kayıt altına alınmıştır

## Faz 2 - MVP Modüllerini Tamamlama

Durum:

- tamamlandı

Kapanan paketler:

- 2-1: Dokun modunun öğrenme kaydı, dikkat ritmi ve Parent panel görünürlüğü kanonik MVP kurallarıyla tamamlandı
- 2-2: Eşleme modunun öğrenildi kuralı, son 5 deneme, ardışık doğru ve Parent panel görünürlüğü Dokun ile hizalandı
- 2-3: Ayna egzersiz sırası ve Uyku ses/süre/volume tercihleri Parent panelden yönetilebilir hale geldi
- 2-4: Ceee otomatik, düşük uyarımlı saklanma/devam döngüsüyle tamamlandı
- 2-5: MVP çocuk yüzeyinde aktif modlar Dokun, Eşleme, Ayna, Uyku ve Ceee olarak daraltıldı; Cümle/Hikaye gelecek mod olarak kodda korunup menüden gizlendi

Faz 2 sonucu:

- Dokun tepkisizlik akışı 10, 20 ve 30 saniyelik sakin ipucu ritmini kullanır
- Dokun ve Eşleme için son 5 deneme, ardışık doğru sayısı ve son çalışma zamanı kaydedilir
- Dokun ve Eşleme öğrenildi durumu son 5 denemede en az 4 doğru ve en az 3 ardışık doğru kuralıyla hesaplanır
- eski localStorage kayıtları yeni alanlara güvenli varsayılanlarla taşınır
- Parent panel Dokun/Eşleme son 5 özetini, doğru serisini ve öğrenildi durumunu gösterir
- Ayna ve Uyku temel ebeveyn tercihleri local-first kalıcılıkla yönetilir
- Ceee otomatik yumuşak devam davranışı taşır
- MVP aktif çocuk yüzeyi kapsamı dar ve tutarlıdır
- build, lint, 26 unit test ve 27 Playwright e2e testi başarılıdır

## Faz 3 - Ürün Sertleştirme

Durum:

- tamamlandı

Kapanan paketler:

- 3-1: PWA service worker cache listesi gerçek client module graph ile hizalandı; offline fallback sayfası eklendi
- 3-2: Parent panelde çevrimdışı durum, kamera desteği, ses/TTS desteği ve yerel kayıt kullanımı görünür hale geldi
- 3-3: Dokun kart görselleri için localStorage kota riski ebeveyne anlaşılır uyarıyla aktarılır hale geldi
- 3-4: Parent panel local-first sınırı açık metne bağlandı; bulut hesabı/senkron varsayımı yapılmadığı görünür oldu
- 3-5: PWA cache manifesti ve Parent panel cihaz durumu unit/e2e regresyon kapsamına alındı

Faz 3 sonucu:

- uygulama kabuğu `/offline.html` ile sakin bir çevrimdışı geri dönüş taşır
- service worker ana shell, stylesheet, client modülleri ve PWA ikonunu cache kapsamına alır
- Parent panel cihaz izinlerini ve fallback davranışlarını çocuk yüzeyine taşmadan gösterir
- kart görseli büyüdüğünde yerel kayıt kapasitesi riski sessiz kalmaz
- build, lint, 28 unit test ve 28 Playwright e2e testi başarılıdır

## Faz 4 - Parent Panel Yorumlu Rehberlik

Durum:

- tamamlandı

Kapanan paketler:

- 4-1: Parent panelde günlük metriklerin altına yorumlu rehberlik kartları eklendi
- 4-2: mevcut local-first analitik, Dokun ilerlemesi ve Eşleme ilerlemesinden tekrar odağı çıkarılır hale geldi
- 4-3: ebeveyn için bugünkü ritim, tekrar odağı ve sıradaki sakin adım metinleri üretildi
- 4-4: yorum üretimi saf helper olarak unit test kapsamına alındı
- 4-5: Parent panel rehberlik kartları Playwright e2e regresyonuna eklendi

Faz 4 sonucu:

- Parent panel yalnız sayı göstermez; kısa yorum ve uygulanabilir sonraki adım verir
- yeni veri deposu veya bulut varsayımı açılmadan local-first özetlerden rehberlik üretilir
- çocuk yüzeyi ve MVP mod kapsamı büyütülmeden ebeveyn güveni güçlendirilir
- build, lint, 29 unit test ve 28 Playwright e2e testi başarılıdır

## Faz 5 - Parent Panel Kontrol Katmanı

Durum:

- tamamlandı

Kapanan paketler:

- 5-1: Parent panelde aktif MVP modlarının görünürlüğünü yöneten kontrol alanı eklendi
- 5-2: Dokun, Eşleme, Ayna, Uyku ve Ceee görünürlüğü local-first `minaplay_module_visibility_v1` kaydına bağlandı
- 5-3: ebeveyn tüm modları kapatsa bile en az bir çocuk modu açık kalacak güvenlik kuralı eklendi
- 5-4: ana ekran kartları, alt navigasyon ve Ceee bonus girişinin görünürlüğü aynı ayardan senkronlanır hale geldi
- 5-5: mod görünürlüğü normalizasyonu ve Parent panel kontrol davranışı unit/e2e regresyon kapsamına alındı

Faz 5 sonucu:

- Parent panel çocuk yüzeyindeki aktif MVP modlarını yerel olarak açıp kapatabilir
- gizlenen modlar ana ekranda, alt navigasyonda ve doğrudan geçiş denemelerinde çocuk yüzeyinden uzak tutulur
- çocuk yüzeyi yeni modla büyütülmeden ebeveyn kontrol katmanı güçlendirilir
- build, lint, 30 unit test ve 29 Playwright e2e testi başarılıdır
- canlı tarayıcı DOM kontrolünde mod görünürlüğü kontrolleri ve yatay taşmasız ana ekran doğrulanmıştır

## Faz 6 - İfade ve Hikaye Aktivasyonu

Durum:

- tamamlandı

Karar:

- `view-sentence` çocuk yüzeyinde kullanıcıya **İfade** adıyla aktif gösterilir
- `view-story` çocuk yüzeyinde **Hikaye** adıyla aktif gösterilir
- Ceee ana mod değil, bonus/kısa dikkat oyunu olarak kalır
- Parent panel mod görünürlüğü kontrolü İfade ve Hikaye modlarını da kapsar

Kapanan paketler:

- 6-1: İfade ve Hikaye ana ekran/alt navigasyon yüzeyinde aktif hale getirildi
- 6-2: Dokun modunda ebeveynin belirli bir kelimeyi odak tekrar olarak seçebilmesi sağlandı
- 6-3: Parent panel Bugün, Düzenle ve Kontrol sekmelerine ayrılarak sadeleştirildi
- 6-4: Faz 6 sonrası genişleyen 33 kartlık Dokun seti, cache query taşıyan görseller ve meta kapsamı kalite hattıyla hizalandı
- 6-5: Bugün sekmesi ham sayı dilinden çıkarılıp bölüm grafikleri, bağımsız/destekli deneme ayrımı, seviyeli kelime önerileri ve öğretmen/rehber diliyle sadeleştirildi
- 6-6: Düzenle ve Kontrol sekmelerindeki yoğun tablo ve ayarlar katlanır çalışma bloklarına ayrıldı
- 6-7: Faz 6 kapanış QA'sı tamamlandı; güvenli medya/yükleme kapsamı sonraki ayrı paket olarak ayrıldı

Faz 6 sonucu:

- İfade ve Hikaye çocuk yüzeyinde aktif görünür
- Dokun tekrarının varsayılan odağı Baba kelimesidir
- ebeveyn tekrar tarzını melodik, oyunlu veya sakin olarak seçebilir
- ebeveyn video/çekim linki ve çekim notunu yerel ayar olarak saklayabilir
- Parent panel ilk açılışta Bugün özetini, yorumlu öneriyi ve üç hızlı aksiyonu gösterir
- düzenleme işleri Düzenle sekmesine, güvenlik ve cihaz işleri Kontrol sekmesine taşınmıştır
- genişleyen 33 kartlık Dokun seti Parent panel ve Playwright beklentileriyle uyumludur
- İfade/Hikaye aktivasyonu `project`, `architecture` ve `phase-06` meta yüzeylerinde aynı dille görünür
- Bugün sekmesi “doğru tıklama” gibi ham metrikler yerine bağımsız deneme, destekle deneme ve tekrar odağı dilini kullanır
- bölüm ağırlığı mini bar grafikleriyle görünür; önerilen kelimeler bilişsel/dil gelişim seviyesine göre sıralanır
- gelişim yorumu ve yorumlu rehberlik özel eğitim/rehber öğretmen tonuna yaklaştırılmıştır
- Düzenle sekmesi odak tekrar, Dokun kartları, Dokun öğrenme ve Eşleme öğrenme bloklarına ayrılmıştır
- Düzenle sekmesi masaüstü ve telefonda tek sütun akışa geri alınmıştır
- Kontrol sekmesi çocuk profili, çocuk kilidi, mod görünürlüğü, Ayna planı, Uyku tercihi ve cihaz durumu bloklarıyla sakinleştirilmiştir
- hızlı aksiyonlar hedef sekmedeki ilgili katlanır bloğu otomatik açar
- 2026-06-26 kapanışında build, lint, 34 unit test ve 31 Playwright e2e testi başarılıdır
- Bugün, Düzenle ve Kontrol sekmeleri masaüstü/telefon görsel QA ve yatay taşma ölçümüyle doğrulanmıştır
- video dosyası yükleme veya oynatma Faz 6'da açılmamıştır; güvenli medya yönetimi sonraki ayrı paket/faz olarak ele alınacaktır

## Faz 7 - Güvenli Medya ve Kayıt

Durum:

- tamamlandı

Karar:

- kısa ses ve video kaydı yalnız Parent panelde, ebeveyn kontrolünde yapılır
- kayıtlar otomatik olarak çocuk yüzeyinde oynatılmaz
- kayıt dosyaları ve dış medya linkleri localStorage yerine şifreli medya kasası olarak IndexedDB içinde saklanır
- medya kasası PBKDF2 ile türetilen anahtar ve AES-GCM şifreleme kullanır
- kasa şifresi cihazda düz metin olarak saklanmaz; şifre unutulursa kayıtlar açılamaz
- YouTube, Vimeo, Drive veya benzeri platformlara uygulama içinden yükleme yapılmaz; ebeveyn dışarıda yüklediği güvenli `https` linkini kaydedebilir
- kamera/mikrofon izni alınamazsa uygulama sakin hata mesajı verir

Kapanan paketler:

- 7-1: Dokun odak tekrarına şifreli medya kasası, kısa ses/video kaydı ve dış medya linki alanı eklendi
- 7-2: ebeveyn sesi çocuk tekrar akışına yalnız Parent panel izniyle ve kasa açıkken bağlandı; video otomatik oynatma kapalı kaldı
- 7-3: arka kapısız şifreli yedek/dışa aktarma akışı ve Android, iOS Safari/PWA, masaüstü Chrome gerçek cihaz QA checklist'i tamamlandı

Faz 7 ara sonucu:

- Düzenle sekmesindeki Odak tekrar bloğu ses/video linkini kabul eder
- medya kasası açılmadan ses/video linki girilemez, kayıt başlatılamaz veya önizleme görülemez
- seçili odak kelime için kısa ses kaydı ve kısa video kaydı başlatma/durdurma butonları görünür
- ses kayıtları en fazla 10 saniye, video kayıtları en fazla 12 saniye ile sınırlandırılmıştır
- kayıtlar ve dış linkler kelimeye bağlı şifreli medya kasasında IndexedDB üzerinde saklanır
- kaydedilen ses/video Parent panelde önizlenebilir ve silinebilir
- dış linkler yalnız `http/https` URL olarak normalize edilir ve önizleme alanında gösterilir
- tekrar ayarlarının düz localStorage payload'ında dış medya linki saklanmaz
- ebeveyn sesi çocuk tekrarında yalnız `Çocuk tekrarında ebeveyn sesini kullan` seçeneği açıksa, medya kasası açıksa ve ilgili kelime için ses kaydı varsa kullanılır
- video kaydı çocuk ekranında otomatik oynatılmaz; yalnız Parent panel önizlemesinde kalır
- gizlilik notu Parent panel medya alanında görünür: kayıtlar buluta yüklenmez, YouTube'a gönderilmez ve video çocuk ekranında otomatik oynatılmaz
- şifreli kasa düz medya, dış link veya kasa şifresi sızdırmadan JSON yedek olarak indirilebilir ve aynı şifreyle başka cihaza geri yüklenebilir
- mevcut kasa içe aktarma öncesinde ebeveyn onayı olmadan değiştirilmez
- gerçek cihaz kontrol listesi `MinaPlay/docs/media-vault-device-qa.md` içinde Android, iOS Safari/PWA ve masaüstü Chrome için hazırdır
- build, lint, 34 unit test ve 31 Playwright e2e testi başarılıdır
- masaüstü/telefon Düzenle sekmesi medya UI ve ebeveyn sesi izni görsel QA/yatay taşma ölçümüyle doğrulanmıştır

## Bugünkü Kapanış Hedefi

- aktif uygulama hedefi `/Users/umitaydin/Documents/MinaGrow/MinaPlay` olarak korunur
- Faz 1, Faz 2, Faz 3, Faz 4, Faz 5 ve Faz 6 kapanışları doğrulanmış kabul edilir
- Faz 7 tamamlandı; sıradaki ürün geliştirme hedefi yeni faz kararı olarak ayrıca açılır
- `MinaPlay` içinde build/lint/test/e2e hattı kararlı tutulur
- yeni iş açılırken çocuk yüzeyi kapsamı büyütülmeden önce Parent panel, Pofi state ve local-first veri sınırları korunur
- Dokun tekrarında odak kelime, ritim çeşidi ve ebeveynin ek içerik notları local-first sınırda tutulur
- Parent panel yeni işlerinde ilk ekran sade kalır; detay ve ayarlar ilgili sekme veya açılır alan arkasında tutulur

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
- İfade: `view-sentence`
- Hikaye: `view-story`
- Ayna: `view-mirror`
- Uyku: `view-sleep`
- Ceee: `view-peekaboo`
- Parent panel: `view-parent`

MVP dışı veya pasif modlar:

- gelişmiş ebeveyn analizleri

MVP sürecinde yeni mod eklemek, mevcut modları büyütmek veya kapsamı genişletmek yerine stabilite, tutarlılık ve kullanıcı hissi öncelenir.

## Tam Ürün Bilgi Mimarisi

Ana modlar:

- Dokun: `view-touch`
- Eşleme: `view-match`
- İfade: `view-sentence`
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

- tamamlandı / referans karar seti

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

### 3. Kanonik Uygulama Doğrulama

Amaç:

- `/Users/umitaydin/Documents/MinaGrow/MinaPlay` içindeki V2 uygulama omurgasını install/build/lint/test/e2e hattıyla doğrulanabilir halde tutmak

Kapanış ölçütü:

- `npm install` veya eşdeğer bağımlılık kurulumu tamamlanır
- `npm run build` çalışır veya açık kırıklar kayıt altına alınır
- `npm run lint` çalışır veya açık kırıklar kayıt altına alınır
- `npm test` çalışır veya test yüzeyi yoksa bu durum kayıt altına alınır
- `npm run test:e2e` çalışır veya e2e yüzeyi yoksa bu durum kayıt altına alınır

### 4. Ürün Sertleştirme

Amaç:

- mobil/tablet Playwright görsel kontrolleri
- service worker offline fallback
- mikrofon, kamera ve TTS fallback metinleri
- localStorage ses kaydı kapasite stratejisi
- Parent panel analizlerinin local-first sınırları
- Pofi state çakışması kontrolleri

### 5. V2 Klasör ve Katman Kararı

Amaç:

- bugünü boğmadan ama yarın auth, therapist, görüntülü görüşme, sync ve yeni terapi modüllerini taşıyacak dosya ağacını sabitlemek

Alınan kararlar:

- kanonik uygulama workspace'i `/Users/umitaydin/Documents/MinaGrow/MinaPlay` içindedir
- klasör ağacı `src/core`, `src/pofi`, `src/entities`, `src/features`, `src/services`, `src/shared`, `src/server` olarak ayrılır
- `features` kullanıcıya görünen modül ve panel akışlarını taşır
- `entities` çocuk, parent, therapist, content, progress, session ve plan gibi ürün varlıklarını taşır
- `services` auth, storage, sync, media, speech, camera, analytics ve calls soyutlamalarını taşır
- `server` auth, signaling, storage ve route katmanına yer açar
- adapter-first kuralı geçerlidir; bugün local implementasyon, yarın remote/synced implementasyon eklenebilir
- doğrudan `localStorage` erişimi feature katmanına yayılmaz

### 6. MVP Ekran Akışları

Amaç:

- Ana ekran, Dokun, Eşleme, İfade, Hikaye, Ayna, Uyku ve Ceee için çocuk akışını, Pofi davranışını ve Parent panel kayıtlarını uygulamaya hazır hale getirmek

Alınan kararlar:

- ana ekranda aktif ana modlar Dokun, Eşleme, İfade, Hikaye, Ayna ve Uyku'dur
- Ceee bonus/kısa dikkat oyunu olarak altta görünür kalır
- Dokun modunda hedefler dengeli dağıtılır; 30 saniye tepkisizlik Pofi dikkat akışını tetikler
- Dokun modunda Pofi aktif kartın üst alanına bağlanır; yalnız aktif kart animasyon taşır
- Eşleme modunda sol hedef ve sağda 3 seçenek kullanılır
- Eşleme modunda Pofi solda bekler; 5-10 saniye sonra doğru kartı yumuşak biçimde hatırlatır
- bir nesne için öğrenildi kuralı son 5 denemede en az 4 doğru ve ardışık doğru sayısının en az 3 olmasıdır
- Ayna modunda güvenli ağız hareketleri, dudak çalışmaları, mimik ve yüz ifadesi egzersizleri Parent panel sırasına göre ilerler
- Ayna modunda Pofi solda büyük ve erişilebilir görünür; sağda ayna alanı bulunur
- kamera varsa ölçüm yapılabilir, kamera yoksa görsel anlatım ve süre/tekrar akışı çalışır
- Uyku modunda ses, süre ve kayıt ebeveyn tarafından belirlenir; touch lock ve özel çıkış gesture'ı kullanılır
- Uyku modunda Pofi kaybolmaz; bulut gibi sakin görünür, ay ve Pofi doğal ve çok yavaş hareket eder
- Ceee klasik karşılıklı ce-ee deneyimidir; Pofi yüzünü kapatır, arama cümlesiyle bekler, açılınca kısa sevinçli ses ve görsel geri bildirim verir
- Parent panel kelime, cümle, hikaye, ses, resim, egzersiz sırası ve uyku tercihlerini planlama alanı olarak ele alır

### 7. Pofi Presence Matrisi

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

### 8. Pofi Engine V2 Sözleşmesi

Amaç:

- Pofi motorunu kod yazımından önce role-first, tek instance ve event-driven sözleşmeyle kesinleştirmek

Alınan kararlar:

- Pofi state modeli `module`, `role`, `presence`, `assetKey`, `locked`, `updatedAt` alanlarını taşır
- doğrudan emotion adı state tutulmaz; önce role seçilir, sonra assetKey çözülür
- rol ailesi: `idle`, `attention`, `success`, `error_soft`, `empathy`, `sleep`, `play`, `exercise`
- typed event bus kullanılır; modüller yalnız event gönderir
- user event, system event'ten güçlüdür
- render tek persistent `img` ile çalışır; `innerHTML` ile yeniden kurulum yapılmaz
- MVP'de random asset seçimi yoktur; event -> role/presence -> assetKey çözümü deterministiktir
- Mirror yalnız `exercise.*`, Sleep yalnız `sleep.*`, Ceee yalnız `play.*`, Home/Dokun/Eşleme yalnız `emotion.*` kullanır
- Sleep modunda `focus` ve `stage` kullanılmaz
- Mirror egzersizi sırasında `locked = true` ile yüz sabitlenir

### 8. V2 Teknik Kurulum Sırası

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
