---
name: themes
description: MinaPlay PWA yüzeyindeki görsel dil, tema, renk, hareket, Pofi ve çocuk ekranı ilkelerini tanımlar.
created: 2026-04-17
updated: 2026-04-29
---

# Tema

## Özet

`MinaPlay`in tema dili sakin, yumuşak, düşük uyarımlı ve premium hissiyatlıdır.

Amaç:

- çocuk için güvenli ve davetkar bir ekran üretmek
- ebeveyn için okunur ve kontrollü bir düzen sağlamak
- dikkat çekici ama yorucu olmayan bir görsel ritim kurmak
- Pofi'yi davranışsal rehber olarak konumlandırmak
- tablet ve telefonda sade, temiz ve erişilebilir bir PWA karakteri korumak

## Görsel İlkeler

- minimal UI
- soft pastel renkler
- düşük duyusal yük
- ferah boşluk kullanımı
- yavaş ve anlamlı hareket
- çocuk yüzeyinde az seçenek
- ebeveyn/terapist/eğitimci araçlarında daha analitik ama yine sakin düzen

Görsel hiyerarşi:

`Aktivite odağı > Pofi rehberliği > UI destek elemanları`

Pofi küçük bir ikon değildir; gerektiğinde sahne alabilir. Ancak Pofi'nin sahne alması kalıcı biçimde aktivitenin önüne geçmez. Pofi çocuğun dikkatini göreve geri taşır ve sonra rehber seviyesine döner.

## V2 Renk Sistemi Kararı

MinaPlay V2 ana ekranı sakin, minimal ve çocuk güvenli bir renk sistemi kullanır.

Temel kararlar:

- ana arka plan: `#F7F9FB`
- kart zeminleri: beyaz veya beyaza çok yakın yüzey
- her karta çok hafif pastel ton verilir; ton farkı belirgin değil, sakin destekleyici olur
- pastel aksanlar kart kimliğini taşır; turkuaz, açık yeşil, pembe, mor/lilac, açık gök mavisi ve yumuşak sarı ailesi kullanılabilir
- renkler modları ayırır ama çocuğun dikkatini karttan koparacak yoğunlukta kullanılmaz
- gölge yumuşak ve düşük opaklı olur; premium his verir ama kartları ağırlaştırmaz
- genel his: ferah, dengeli, modern, düşük uyarımlı ve güvenli

Kart görsel sistemi:

- kartlar nefes alan, sade ve düzenli görünür
- ikon sol tarafta belirgin durur
- başlık ve kısa açıklama orta/ana metin alanında okunur
- Pofi her kartta yalnız 1 kez görünür
- Pofi sağ alt köşede küçük yardımcı olarak durur
- Pofi kart içinde dikkat dağıtmaz; kartın ana görseli veya görevi Pofi'den baskın kalır
- kartlar iç içe kart hissi üretmez

## V1 Referans Renk Dili

Referans `public/style.css` içinde şu ana değişkenler kullanılır:

- `--bg-soft`: `#fff8ed`
- `--bg-soft-2`: `#ffe6d6`
- `--ink`: `#2f3f5a`
- `--card`: `#ffffff`
- `--line`: `#f2c5ab`
- `--accent`: `#ff8f66`
- `--accent-dark`: `#e16f4a`
- `--mint`: `#99dec7`
- `--berry`: `#ff6f91`

Ana karakter:

- sıcak açık zemin
- yumuşak mint destek rengi
- kontrollü canlı vurgu
- metin için koyu mavi-gri ton

## Kartlar

Ana ekran tam ürün vizyonunda 6 ana kartı 3x2 düzende gösterebilir. MVP sürecinde yalnız aktif çekirdek modlar görünür veya önceliklenir.

Kart ilkeleri:

- her kartın ana ikon/görseli baskın olur
- Pofi standart olarak sağ-alt köşede rehber olarak durur
- Ceee MVP'de aktif 5. alan olarak geniş alt kart şeklinde gösterilebilir
- kartlar gereksiz iç içe yığılmaz
- mobilde taşma üretmez

V2 responsive karar:

- tablet: aktif MVP kartları 2x2 grid düzeninde akar
- mobil: kartlar küçültülmez; tek kolon listeye dönüşür
- layout sıkıştırılmaz; reflow yapılır
- hiyerarşi, boşluk hissi ve Pofi'nin sağ alt konumu korunur

## Pofi Görsel Sistemi

Pofi bir davranışsal etkileşim sistemidir.

## Pofi Mizaç Anayasası

Pofi'nin mizacı enerjik ama kontrollü, güven veren, sabırlı ve yönlendiricidir.

Pofi çocuğu eğlendirebilir, dikkat çekebilir ve tepkisiz çocuğu oyuna davet edebilir; ama kontrolsüz gösteri yapmaz. Pofi'nin her mimik ve hareketi çocuğa bir sonraki güvenli adımı anlatmak için vardır. Asset sistemi bu mizaca hizmet eder; asset var diye rastgele duygu, el, ağız veya göz değişimi yapılmaz.

Karakter özellikleri:

- enerjik ama kontrollü rehber
- sabırlı tekrar arkadaşı
- düşük uyarımlı model
- yargılamayan destekçi
- çocuğun odağını göreve geri taşıyan küçük işaretçi
- tepkisiz çocuğu merak, sıcaklık ve kısa ipuçlarıyla oyuna çeken arkadaş
- ebeveynin güven duyacağı tutarlı karakter

Pofi'nin yapmayacağı şeyler:

- sürekli el kol hareketi
- hızlı ve anlamsız mimik değişimi
- rastgele şaşırma, aşırı heyecan veya abartılı kutlama
- yanlışta üzülerek çocuğa başarısızlık hissi verme
- çocuğun görevini gölgeleyen sahne davranışı
- aynı anda birden fazla anlam taşıyan yüz ve jest kombinasyonu

Pofi'nin yapacağı şeyler:

- hedefi göstermek için tek ve net işaret kullanır
- beklerken sakin kalır
- tepkisiz çocukta attention rolüne geçerek daha canlı ama sınırlı biçimde dikkat toplar
- doğru denemede kısa ve yumuşak onay verir
- hedef dışı denemede üzgün görünmek yerine "buraya bak" anlamında yumuşak yönlendirme yapar
- egzersizde model olur; egzersiz bitene kadar yüz ve jest sabit kalır
- uykuda görünür ama dikkat çekmez
- Ceee gibi oyunlarda bile ani, ürkütücü veya taşkın davranmaz

Mimik ve hareket eşleşmesi:

- `idle`: açık yüz, küçük gülümseme, açık eller; bekleme ve güven
- `welcome`: açık/yumuşak göz, happy kaş, smile-soft ağız, standart allık; güvenli karşılama
- `guide`: yumuşak bakış, happy kaş, smile ağız; sıradaki aksiyon
- `attention`: wide-open göz, happy kaş, open-smile-soft ağız, kısa point el ve belirgin allık; tepkisiz çocuğu oyuna çağırma
- `model`: egzersize uygun tek yüz/tek el; taklit edilecek örnek
- `affirm`: kısa gülümseme ve tamam işareti; "oldu" hissi
- `softRedirect`: üzgün yüz değil, sakin işaret; "bir daha buraya bakalım"
- `sleep`: kapalı/sakin yüz ve kapalı eller; düşük dikkat
- `play`: kontrollü oyun jesti; neşe var ama taşkınlık yok

Mizacın kısa kuralı:

`Pofi hareket ediyorsa bunun çocuğa söylediği bir şey olmalıdır.`

Asset kararları:

- Pofi için PNG sistemi esas alınır
- Pofi görselleri runtime'da iki düzeyde kullanılabilir:
  - `poses`: doğrudan kullanılan tam Pofi pozları
  - `parts`: gövde, göz, ağız, el ve ileride kaş/efekt gibi kontrollü katmanlar
- parça sistemi serbest kombinasyon sistemi değildir; role-first davranış sözleşmesinin seçtiği deterministik kombinasyonları gösterir
- `blush-soft-v01.png` standart sıcaklık katmanıdır; başarı ve attention rollerinde daha belirginleşebilir
- happy kaş pozitif/rehber rollerde standart destek katmanı olarak kullanılır
- el assetleri yalnız rehberlik anlamı taşıdığında kullanılır: açık bekleme, işaret etme, dokunma/model olma, tamam/onay, kapalı sakin uyku
- el katmanı gerektiğinde yüzün üstünde görünür; yüzün bir kısmının arkasına düşmez
- el katmanı zorunlu değildir; idle, sakin bekleme ve yalnız yüz mimiklerinin yeterli olduğu durumlarda gizlenebilir
- karşılama veya mod başlangıcında doğrudan çocuğa uzanan parmak/işaret eli kullanılmaz; bu jest yalnız açık bir hedefe yönlendirme gerektiğinde görünür
- `pofi_hand_point_left_v01` ve `pofi_hand_point_right_v01` kalıcı poz değildir; "buraya tıkla" anlamında 1-2 saniyelik kısa ipucu olarak görünür ve sonra kaybolur
- UI ikonları için SVG kullanılabilir
- background görselleri için PNG kullanılabilir
- asset çözümü deterministiktir; MVP'de random asset varyasyonu kullanılmaz

State ve geçiş ilkeleri:

- aynı anda tek aktif Pofi state olur
- aynı container içinde üst üste render olmaz
- role/presence geçişleri fade/scale ile yumuşak olur
- hızlı duygu değişimi engellenir
- idle sırasında rastgele duygu seçilmez; yalnız seyrek ve doğal blink veya sakin settle dönüşü yapılır
- blink sırasında Pofi'nin role, mood, gövde hareketi ve el katmanı değişmez; yalnız göz katmanı kısa süreli kapanıp açılır
- rastgele göz, ağız veya el drift'i kullanılmaz; ancak Pofi'nin kontrollü life-motion davranışı olabilir
- life-motion sırasında Pofi bulunduğu konum çevresinde süzülür; gövde hareket sınırı yaklaşık gövde ebatının onda biriyle sınırlıdır
- nefes hareketinde ölçek `0.95` ile `1.05` arasında kalır
- nefes ritmi role göre değişebilir; Pofi'nin gövde süzülmesi sakin algı için yavaş tutulur ve önceki hızlı denemelerin yaklaşık üçte biri hızında çalışır
- hafif sağa/sola rotasyon olabilir; rotasyon rehberliği bozacak kadar belirginleşmez
- ağız, göz ve kaş katmanları birlikte hareket eder; yüzün gövde üzerindeki hareket sınırı gövde hareket limitinin yaklaşık beşte biridir
- göz değişimleri kısa tutulur; uzun blur/geçiş çocuğun ifadeyi anlamasını zorlaştırmamalıdır
- Uyku modunda yalnız sleepy ve sleep kullanılır
- Ayna egzersizi sırasında yalnız egzersiz yüzü görünür; ödül yüzü tamamlanınca gelir
- render persistent katmanlarla yapılır; katmanlar gereksiz yeniden oluşturulmaz

## Pofi Presence Sistemi

Pofi yalnız state değiştiren bir karakter değildir. Pofi'nin varlık seviyesi, yani `presence` değeri vardır. Her ekranda Pofi'nin ne kadar görünür olduğu, ne kadar büyük olduğu ve ne kadar dikkat çektiği bağlama göre kontrol edilir.

Presence seviyeleri:

- `gizli`: görünmez
- `hafif`: küçük ve arka planda
- `normal`: rehber seviyesinde
- `odak`: biraz büyür ve dikkat çeker
- `sahne`: kısa süreli büyük ve baskın görünür

Kurallar:

- Pofi her zaman aynı boyutta ve aynı güçte görünmez
- Pofi nefes alır gibi hafif büyür ve standart büyüklüğe dönebilir
- ekranın amacına göre geri çekilir veya öne çıkar
- gereksiz yere dikkat çekmez
- çocuğun yaptığı aktivitenin önüne geçmez
- sahne seviyesi kısa sürelidir ve ardından rehber moduna dönülür
- `odak` seviyesi yaklaşık 1.3x-1.6x aralığında düşünülebilir
- `sahne` seviyesi en fazla 3x büyür
- sahne seviyesi dikkat toplamak için kullanılır, kalıcı ekran düzeni değildir
- `sahne` seviyesi ödül anlarında 300-500 ms kullanılır
- aynı anda tek duygu ve tek yüz görünür
- Uyku aktifken Pofi `hafif` presence çizgisinde bulut gibi görünür; dikkat çekmez, kaybolmaz ve sahneye çıkmaz

Örnek:

Çocuk bir kelimeye yönlendirildiği halde ilgisi dağılmışsa Pofi önce `odak` seviyesine çıkar. Sesli uyaran yeterli olmazsa kısa süreli `sahne` seviyesine geçebilir, görüntü ve sesle dikkati toplar, sonra `normal` rehber seviyesine döner.

## Hareket ve Animasyon

Animasyonlar ürünün öğrenme ve sakinleşme amacını destekler.

Kanonik hareketler:

- düşük uyarımlı hava/ortam efektleri
- Pofi emotion/state geçişleri
- uyku modunda yıldızlı sakin sahne
- dokunma sonrası hafif geri bildirimler
- Ayna modunda egzersiz -> bekleme -> ödül akışı

İlke:

- hareket kısa ve anlamlı olur
- dikkat dağıtan sürekli hareket azaltılır
- uyku modunda kontrast ve hareket sakinleşir
- yanlış cevap veya hedef dışı dokunuşta cezalandırıcı görsel kullanılmaz
- hover veya geçiş hareketleri çok yumuşak olmalıdır; hızlı tepki hissi verilmez

## Mod Bazlı Görsel Yerleşim

V2'de Pofi tek görsel instance olarak davranır ama her modun sahne içindeki konumu farklıdır.

- Dokun: Pofi aktif kartın üst alanına bağlanır; yalnız aktif kart animasyon taşır, diğer kartlar statik kalır
- Eşleme: Pofi solda sakin rehber olarak bekler; sürekli animasyon yapmaz, 5-10 saniye bekleme sonrası doğru kartı yumuşak hatırlatır
- Ayna: solda büyük Pofi, sağda ayna alanı bulunur; Pofi erişilebilirlik için büyük ve net görünür
- Uyku: ay ve Pofi her zaman görünür; Pofi bulut gibi drift eder, ay çok yavaş ve doğal bir hat üzerinde hareket eder
- Ceee: çocuk odası hissinde temiz PNG tarzı görseller kullanılır; Pofi bazen yüzünü, bazen kendini nesnelerin arkasında saklar

## Renk ve Hareket Güvenlik Anayasası

Bu kurallar tüm ekranlar için zorunludur.

- aynı ekranda en fazla 3-4 ana renk kullanılır
- pastel ve muted tonlar temel alınır
- neon, aşırı doygun renkler ve göz yoran yüksek kontrast kombinasyonları kullanılmaz
- saniyede 3'ten fazla yanıp sönme, ekranı kaplayan hızlı parlama ve titreşim animasyonları kullanılmaz
- aynı anda yalnız 1 hareketli öğe bulunur
- patlamalı geçiş, ani sıçrama ve sert giriş/çıkış animasyonları kullanılmaz
- tüm animasyonlar 300-500 ms aralığında, ease-in-out hissinde ve tercihen fade/soft scale ile çalışır
- sürekli animasyonlar düşük frekanslıdır; Pofi gövde süzülmesi role göre yaklaşık 7-15 saniye aralığında kalır
- aynı anda hem renk değişimi hem hareket verilmez
- minimum dokunma alanı 44 x 44 px olur
- arka plan sakin kalır; hareketli/video arka plan kullanılmaz
- görsel hareket içeriğin ve aktivitenin önüne geçemez

## Tipografi

Mevcut font ailesi:

- `Baloo 2`
- `Trebuchet MS`
- `Gill Sans`
- `sans-serif`

Yorum:

- yuvarlak ve çocuk dostu bir karakter hedeflenir
- okunurluk oyun hissinden daha önemlidir
- uzun metinler yerine kısa ürün cümleleri tercih edilir
- font boyutu viewport genişliğiyle agresif ölçeklenmez
- metin taşması yerine satır kırımı veya layout reflow tercih edilir

## Parent Panel Görsel Dili

Parent panel çocuk ekranından daha sakin, daha nötr ve daha yapılandırılmış hissettirmelidir.

Kurallar:

- nötr renkler kullanılır
- animasyon azaltılır
- layout sadeleştirilir
- karmaşık grafikler kullanılmaz
- ham veri yerine anlamlı kısa yorumlar ve yönlendirme gösterilir
- ebeveyn panelden kontrol ve güven hissiyle çıkmalıdır

## Yaşa Göre Genişleme

Bugünkü yüzey 0-5 başlangıç odağına göre sade kalır.

MinaPlay ileride 0-18 yaş aralığına genişlerse görsel ton ve arayüz yoğunluğu yaşa göre farklılaşabilir. Bu farklılaşma bugünkü çocuk yüzeyine erken taşınmaz; okul öncesi, örgün öğretim, gönüllü eğitimci ağı ve terapist/eğitimci araçları ayrı katmanlarda ele alınır.

## Tema Kararları

Bugünkü kararlar:

- tek ana tema yeterlidir
- dark mode veya çoklu tema sistemi erken açılmaz
- uyku modu kendi koyu/sakin sahnesini modül içinde taşır
- ürün adı görünür yüzeyde `MinaPlay` olarak öne çıkar
- Pofi adı ve kimliği korunur
- eski karakter isimleri görünür ürün kopyasında kullanılmaz

## Görsel Riskler

- ebeveyn panelleri artarsa çocuk ekranı fazla yoğunlaşabilir
- Pofi ana içerikten baskın hale gelirse hiyerarşi bozulabilir
- açık pastel palet fazla tekdüze hale gelebilir
- uyku modu ile ana oyun modu arasında geçiş çok sert olmamalıdır
- bazı emoji karakterleri platformdan platforma farklı görünebilir
- SVG ve PNG assetlerin boyutu PWA performansını etkileyebilir

## Yakın İyileştirme Adayları

- MinaPlay logo ve ikon ailesini netleştirmek
- Pofi PNG emoji setini üretim kalitesine çekmek
- eski karakter ve gövde assetlerini legacy olarak ayırmak
- Türkçe karakterleri eksik metinleri düzeltmek
- mobilde ebeveyn panelini daha kompakt ve analitik hale getirmek
- PWA splash/icon setini üretim kalitesine çekmek

## Kısa Kural

Tema çocuğu sakin biçimde çağırmalı, ebeveyne güven vermeli ve Pofi'yi rehber olarak tutmalıdır.
