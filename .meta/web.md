---
name: web
description: MinaPlay PWA yüzeyinin rolünü, ana kullanım akışını, modüllerini ve bugünkü yapı yönünü tanımlar.
created: 2026-04-17
updated: 2026-06-25
---

# Web

## Özet

Bu belge `MinaPlay` PWA yüzeyinin rolünü ve bugünkü kanonik bilgi mimarisini görünür kılar.

Ana yorum:

- web yüzeyi ürünün bugünkü ana deneyimidir
- hedef cihaz telefon ve tablettir
- başlangıç odağı 0-5 yaş çocuk kullanıcıdır
- ebeveyn destekleyici role sahiptir ve ayarları ayrı katmandan yönetir
- ekran dili Türkçe, sade, sakin ve düşük baskılı olmalıdır
- ana etkileşim dokunma, dinleme, taklit, duygu tepkisi ve tekrar üzerine kuruludur

## Ürün Yüzeyi

PWA ana kabuğu `public/index.html` içinde yaşar.

Ana parçalar:

- ana ekran kartları
- Pofi davranış ve görsel ifade alanları
- Pofi presence katmanı
- modül view'leri
- Parent panel
- PWA manifest ve service worker davranışı

V2 ana ekranı MVP sürecinde aktif çekirdek alanlara odaklanır. Tablet düzeni aktif kartları dengeli grid olarak taşır; Ceee geniş bonus kart olarak altta yer alır. Mobil portre düzen kartları küçültmez; tek kolon listeye dönüştürür. Mobil yatay düzende alan genişliğine göre 2-3 kolon kullanılabilir. MVP'de aktif alanlar Ana Ekran, Dokun, Eşleme, İfade, Hikaye, Ayna, Uyku ve Ceee'dir. Pofi kartlarda ve sahnede rehberdir; gerektiğinde büyüyebilir, dikkat çekebilir ve sonra geri çekilir.

## Bilgi Mimarisi

Ana view eşleşmeleri:

- Dokun Dinle / Touch & Listen: `view-touch`
- Eşleme / Match: `view-match`
- İfade / Sentence: `view-sentence`
- Hikaye / Story: `view-story`
- Ayna / Mirror: `view-mirror`
- Uyku / Sleep: `view-sleep`
- Ceee / Peekaboo: `view-peekaboo`
- Parent panel: `view-parent`

MVP aktif view'leri:

- Ana ekran
- `view-touch`
- `view-match`
- `view-sentence`
- `view-story`
- `view-mirror`
- `view-sleep`
- `view-peekaboo`
- `view-parent`

MVP dışı veya pasif view'ler:

- gelişmiş ebeveyn analizleri

## Ana Kullanım Akışı

1. Çocuk veya ebeveyn uygulamayı açar.
2. Ana ekranda MVP aktif alanları görünür; İfade ve Hikaye ana modlar arasında yer alır, Ceee ise bonus/kısa dikkat oyunu olarak altta kalır.
3. Pofi mevcut bağlama uygun tek aktif state ile rehberlik eder.
4. Çocuk seçtiği aktif modda dokunur, eşler, taklit eder, sakinleşir veya Ceee oynar.
5. Yanlış veya hedef dışı etkileşim cezalandırılmaz; Pofi yumuşak yönlendirme yapar.
6. Ebeveyn ayarları ve içerik yönetimi Parent panel içinde ayrı katmanda tutulur.

## Modül Yorumu

### Dokun

Rol:

- çocuğun nesneye dokunup kelime veya ses duymasını sağlamak
- Pofi'nin hedef nesneyi göstermesi veya yönlendirmesi
- doğru hedefte olumlu tepki ve ilerleme üretmek

İlke:

- hedef dışı dokunuş başarısızlık hissi yaratmaz
- ses çalabilir, Pofi yumuşak yönlendirmeye devam eder
- yağmur, kar, rüzgar, dolu, şimşek/yıldırım, pus ve gökkuşağı gibi efektler düşük uyarımlı kalır
- ebeveyn belirli bir kelimeyi, örneğin Baba, odak tekrar olarak seçebilir
- odak tekrar düz döngü gibi hissettirilmez; melodik, oyunlu veya sakin ritimlerle çeşitlendirilir
- ebeveyn video/çekim linki ve çekim notunu saklayabilir, ancak büyük medya yükleme/oynatma ayrı güvenli medya paketi olarak ele alınır
- Pofi hedefleri karışık sırayla yönlendirebilir
- yönlendirme dağılımı dengeli olmalıdır; bir kart aşırı fazla, başka kart çok az çalıştırılmaz
- doğru dokunuşta Pofi güler veya olumlu emojiyle onay verir ve sesli geri bildirim verir
- hedef dışı dokunuşta Pofi üzülebilir, düşünebilir veya yumuşak bir tavırla "tekrar dene" çizgisinde yönlendirebilir
- çocuk 30 saniye tepki vermezse Pofi önce düşünür/yardım eder gibi emojilere geçebilir; gerekirse dikkat toplamak için büyür ve sesli uyaran verir
- Pofi aktif kartın üst alanına bağlanır; aktif kart içinde kart genişliğinden biraz daha belirgin olabilir
- yalnız aktif kart animasyon taşır; diğer kartlar statik kalır

### Eşleme

Rol:

- Dokun'dan ayrı bir ana oyun olarak hedef seçme ve eşleme pratiği sağlamak
- Pofi'nin bir hedef seçmesi ve çocuğun aynı nesneyi bulması
- sol hedef + sağ seçenekler mantığını taşımak

Not:

- solda 1 hedef nesne bulunur
- sağda 3 seçenek bulunur ve seçeneklerden biri hedef nesnedir
- Pofi solda bekler
- Pofi sürekli hareket etmez; 5-10 saniye bekleme sonrası doğru kartı yumuşak biçimde işaret eder veya hatırlatır
- Pofi ara sıra doğruyu gösterip nesnenin adını söyleyebilir
- emoji ve sesli tepkiler çocuğa yönlendirme verir
- doğru/yanlış denemeler istatistik olarak kaydedilir
- bir nesne için MVP öğrenildi kuralı son 5 denemede en az 4 doğru ve ardışık doğru sayısının en az 3 olmasıdır
- öğrenilen nesne için Parent panel ebeveyne yeni kart/nesne ekleme uyarısı verebilir

### İfade

Rol:

- çocuğun iki görsel seçerek basit cümle kurmasını sağlamak
- seçilen görselleri birleştirip cümle olarak dinletmek

Akış:

- seç
- birleştir
- dinle

Pofi burada yardımcı ve rehber olabilir; ana iş iki görsel seçimi ve cümle kurmadır.

### Hikaye

Rol:

- kısa, eğitsel ve kolay algılanır hikayeleri dinletmek
- kelimeden cümleye ve basit anlatıya geçişi desteklemek

Akış:

- dinle
- tekrar et
- sonraki

Korunacak parçalar:

- kolay seviye
- pack yapısı
- ebeveyn tarafında kolay cümle ekleme/silme
- story pack ve kayıt ayarları

Pofi anlatıcı veya rehber rolündedir.

### Ayna

Rol:

- Pofi'nin güvenli ağız hareketi, dudak ve yüz ifadesi egzersizini göstermesi
- çocuğun kamera aynasıyla kendini izleyip taklit etmesi

İlke:

- katı algılama yoktur
- zaman bazlı ödül vardır
- egzersiz sırasında yalnız egzersiz yüzü gösterilir
- ödül yüzü egzersiz tamamlandıktan sonra görünür

Akış:

- egzersiz yüzünü göster
- bekle
- tamamlanınca ödül ver

Çalışma grupları:

- duygu durumu, mimik ve emoji taklidi
- ses/ağız açıklığı egzersizleri
- dudak egzersizleri
- yüz egzersizleri

Kural:

- egzersiz sıralaması Parent panelden belirlenir
- kamera varsa çocuğun tepkisi ölçülebilir
- kamera yoksa ölçüm yapılmaz; Pofi egzersizi detaylı görsel anlatımla gösterir
- kamera yokluğu modu pasif yapmaz
- düzen solda büyük Pofi, sağda ayna alanı olarak düşünülür
- Pofi erişilebilirlik için büyük görünür; egzersiz sırasında tek ifade ve tek model yüz kullanılır
- kamera varsa yalnız yumuşak geri bildirim verir; klinik kesinlik iddiası üretmez

### Uyku

Rol:

- sakin, düşük uyarımlı gece sahnesi sağlamak
- ay, yıldızlar, yavaş hareket eden gökyüzü öğeleri ve uykulu/uyuyan Pofi kullanmak

İlke:

- çocuk yüzeyinde minimum kontrol olmalı
- çocuk kazara dokunsa bile ekran değişmemelidir
- ekran kilitleme / touch lock davranışı temel güvenlik kararıdır
- akış sleepy -> sleep olarak korunur
- rastgele duygu veya guide state çalışmaz
- ana ekranda Pofi uykulu görünür
- ses açılınca Pofi uyur
- ses, süre ve kayıt tercihi ebeveyn tarafından belirlenir
- Parent panel geçişi sol üst köşeye 3 tık ve aşağı çekme benzeri kontrollü gesture ile yapılır
- uyku ekranından çıkış, müzik başladıktan sonra da aynı özel gesture ile olur
- uyku sahnesi tam ortam modudur; normal UI etkileşimi göstermez
- Pofi uyku aktifken kaybolmaz; bulut gibi, sakin ve düşük dikkatli görünür
- ay doğal bir gökyüzü nesnesi gibi yaklaşık 30 dakikalık çok yavaş geçişle hareket eder ve hafif scale değişimi taşıyabilir
- Pofi bulut davranışıyla rastgele drift, çok hafif dikey hareket ve yavaş scale değişimi taşır
- ay ve Pofi her zaman görünür; ani hareket, kaybolma veya dikkat çekici tepki yoktur

Ses adayları:

- okyanus ve doğa sesleri
- hafif elektrikli süpürge benzeri beyaz gürültü
- pış pış veya ninni
- anne veya baba ses kaydı

Amaç:

- internetsiz, sakin bir uyku arkadaşı olmak

### Ceee

Rol:

- kısa dikkat ve neşe oyunu olarak Pofi'nin peekaboo/ce-ee halini kullanmak
- MVP'de aktif 5. alan olarak yer alabilir
- oyun temelli, neşeli ama düşük uyarımlı klasik karşılıklı ce-ee deneyimi kurmak

İlke:

- silinmez
- illa gizli veya bonus strip olmak zorunda değildir
- kartlar arasında veya ayrı bir aktif alan olarak konumlanabilir
- çocuğu neşelendiren ve dikkat artıran kısa oyun olarak kalır
- kötü veya ham SVG görsel dili kullanılmaz; temiz PNG tarzı görseller tercih edilir
- Pofi oyunbaz ve hafif yaramaz hissedebilir, ama ani ve ürkütücü davranmaz

Mekanik:

- Pofi büyük ve merkezde kalır
- Pofi gözlerini/yüzünü kapatarak kısa bekleme anı oluşturur
- kapalı göz fazında çocuğun adıyla kısa arama cümleleri söylenebilir
- Pofi açılınca kısa, heyecanlı ama ürkütmeyen "Ceee" sesi ve görsel geri bildirim verir
- çocuk ekrana dokunarak yeni tur başlatabilir
- hiç etkileşim olmazsa oyun aralıklı sakin nefeslerle otomatik ve yumuşak biçimde devam eder

### Parent Panel

Rol:

- ebeveyn ayarlarını çocuk yüzeyinden ayırmak
- içerik, kayıt, kullanım sınırı ve ilerleme gibi destek araçlarını yönetmek
- uygulamanın kullanım analizini göstermek
- hangi bölümde neler oynandığını, neler yapıldığını, doğru/yanlış denemeleri, tamamlanan egzersizleri, tekrar sayısını ve oturum sıklığını görünür yapmak
- veriyi yalnız sayı olarak değil, kısa yorum ve yönlendirme ile anlamlandırmak
- eğitim planlama, kelime/cümle/hikaye yönetimi ve içerik kayıt alanı olarak çalışmak

İlke:

- güçlü olabilir ama çocuk yüzeyini boğmaz
- ileride terapist/eğitimci araçları ayrı katmanlarda büyüyebilir
- ebeveyn 5 saniyede ilerleme, tekrar ihtiyacı ve kayıt durumunu anlayabilmelidir
- ilk açılış Bugün sekmesidir; ebeveyn önce özet, yorumlu öneri ve hızlı aksiyonları görür
- Düzenle sekmesi kelime/kart/tekrar ve öğrenme detayları içindir
- Kontrol sekmesi çocuk kilidi, mod görünürlüğü, cihaz durumu, Ayna ve Uyku tercihleri içindir
- panel destekleyici ve yönlendirici dil kullanır; başarısız, yetersiz, eksik gibi yargılayıcı ifadeler kullanılmaz
- panel çocuk ekranından daha sade, daha ciddi ve daha az renkli ayrılır; teknik veya korkutucu görünmez
- Parent Panel MVP kelime/nesne bazlı deneme, doğru sayısı, ardışık doğru sayısı, son 5 deneme, öğrenildi durumu ve günlük kısa özet gösterir
- MVP öğrenildi kuralı: son 5 denemede en az 4 doğru ve ardışık doğru sayısı en az 3
- temel set seçimi yapılabilir; karmaşık grafik, ileri analiz ve AI öneri sistemi MVP dışında kalır
- sesler, resimler ve ileride GIF/görsel destekleri ebeveyn tarafından yönetilebilir
- kelimeler, cümleler ve hikayeler ebeveyn tarafından planlanabilir veya kaydedilebilir
- egzersiz sırası ve uyku ses/süre/kayıt tercihleri ebeveyn tarafından belirlenebilir

Kontrol adayları:

- kullanım limitleri
- modül kontrolü
- ekran kilidi / screen lock

Çocuk yapamaz:

- modülden kontrolsüz çıkış
- dış uygulama açma
- ayar değiştirme

## UX İlkeleri

- büyük dokunma alanları kullanılır
- çocuk ekranı mümkün olduğunca tek amacı taşır
- yazılar kısa tutulur
- gereksiz açıklama ve ayar kalabalığı azaltılır
- animasyon dikkat çekici ama yorucu olmayan seviyede kalır
- ebeveyn araçları ayrı katmanda tutulur
- kamera, mikrofon, ses ve tarayıcı desteği durumları açıkça ifade edilir
- olumsuz geri bildirim verilmez
- tekrar ve yumuşak yönlendirme ana yöntemdir

## V2 Ana Ekran Layout Kararı

Mevcut ana ekran hiyerarşisi doğru kabul edilir; V2 tasarım sisteminde bu hiyerarşi değiştirilmez, yalnız görsel sakinlik ve tutarlılık güçlendirilir.

Kurallar:

- arka plan sakin ve yumuşaktır
- kartlar beyaz veya beyaza yakın yüzey üzerine çok hafif pastel ton taşır
- her kartta tek ana ikon sol tarafta belirgin durur
- başlık ve kısa açıklama sade, okunabilir ve orta/ana metin alanında kalır
- Pofi her kartta yalnız 1 kez görünür
- Pofi sabit biçimde sağ alt köşede küçük yardımcı olarak durur
- kartlar kalabalık hissettirmez
- gölgeler çok hafif ve yumuşaktır
- çocuk ekranında modern kalite hissi korunur ama uyarım artırılmaz

Responsive karar:

- tablet: ilk 4 aktif kart için 2x2 grid, Ceee için geniş alt kart
- mobil portre: tek kolon liste
- mobil yatay: 2-3 kolon
- layout sıkıştırılmaz; reflow yapılır
- aynı hiyerarşi, aynı boşluk hissi ve aynı Pofi konumu korunur

## Ortak Mod Ekranı Kalıbı

Tüm mod ekranları benzer bir düzen mantığı kullanır.

Kalıp:

- üstte kısa yönlendirme
- ortada tek görev alanı
- Pofi mod bağlamına göre sağda, solda veya aktif kart alanında
- altta kısa geri bildirim

Kurallar:

- her mod kendi oyunsal davranışını taşıyabilir ama ekran ritmi tutarlı kalır
- çocuk her modda "neredeyim ve ne yapacağım" sorusunu hızlıca anlayabilmelidir
- Pofi tek global instance olarak merkezi `pofi-root` içinde render edilir; modüller Pofi görseli oluşturmaz
- modüller Pofi'yi doğrudan yönetmez, yalnız olay gönderir
- Pofi rehberlik eder, görev alanını ele geçirmez
- geri bildirim kısa, yumuşak ve yargısız olur

## Pofi Davranış Matrisi

Bu matris Pofi'nin MVP modlarında nasıl tepki vereceğini tanımlar. Pofi asla bağırmaz, hızlı değişmez, cezalandırmaz veya çocuğun hatasını büyütmez. Pofi her zaman sabırlı, yumuşak ve öngörülebilir davranır.

Presence tüm modlarda zorunlu sistemdir. Pofi sabit görünmez; bulunduğu duruma göre görünürlüğünü ve etkisini değiştirir. Genel kural: Pofi ana odak değil, rehberdir; `stage` yalnız kısa ödül anlarında 300-500 ms kullanılır ve sonra geri çekilir.

Mod bazlı presence özeti:

- Dokun: başlangıç `hafif -> normal`, hedefte `odak`, doğru cevapta kısa `sahne`, yanlışta `normal`, beklemede `odak`
- Eşleme: başlangıç `hafif`, hedefte `odak`, doğru eşlemede kısa `sahne`, yanlışta `normal`, beklemede `odak`
- Ayna: başlangıç `normal`, egzersiz ve taklit sırasında `odak`, yapamazsa `normal`, tamamlanınca kısa `sahne`
- Uyku: başlangıç `hafif`, uyku aktifken bulut gibi `hafif`; dikkat çekmez, kaybolmaz ve etkileşimlere tepki vermez

### Dokun Pofi Davranışı

- giriş: `subtle -> normal`, calm_happy, yavaş nefes, opsiyonel "hazır mıyız?"
- hedef kelime seçildiğinde: `normal -> focus`, attentive, çok hafif 1.05 büyüme, kelime okunur
- doğru nesneye dokunulduğunda: kısa `stage`, happy, 1.15-1.2 büyüme, çok hafif parıltı, 300-500 ms sonra `normal`, ses "Aferin"
- yanlış/başka nesneye dokunulduğunda: `normal`, soft_warn veya confused, hafif kafa eğme, ses "Bir daha deneyelim"
- 10 saniye tepki yoksa: `focus`, attentive, hedefe doğru mini bakış/işaret hissi, kelime tekrar edilir
- 30 saniye tepki yoksa: `focus -> kısa stage`, belirgin dikkat, hedefe yönelme, ses "Buraya dokun" veya "Gel birlikte yapalım"
- aynı kelime 3 kez bilinmezse: `normal`, sabırlı/sakin yüz, doğru nesne kısa süre highlight edilir, ses "Bu ..."
- aynı kelime üst üste doğru yapılırsa: kısa `stage`, happy_strong, küçük abartısız kutlama, seviye artırılabilir

Kısa ilke: doğru -> kısa ödül, yanlış -> yumuşak yönlendirme, bekleme -> yardım, zorlanma -> öğretme.

### Eşleme Pofi Davranışı

- konum: solda, sabit, rehber
- hedef gösterildiğinde: `normal -> focus`, dikkat/hafif gülümseme, 1.05 büyüme, ses "Bunu bulalım" veya "Aynısını seç"
- doğru eşleştirme: kısa `stage`, happy, 1.15 büyüme, çok hafif glow, 300-400 ms sonra `normal`, ses "Aferin"
- yanlış eşleştirme: Pofi üzülmez ve dramatik tepki vermez; `normal`, confused/soft_warn, hafif kafa eğme, ses "Bir daha deneyelim"
- çocuk beklerse: 10 saniye sonra hedefe bakar ve kelimeyi tekrar eder; "Hangisi?" çizgisinde yumuşak hatırlatma verir
- hatırlatma ritmi: ilk tekrar 10 sn, ikinci tekrar 20 sn, üçüncü tekrar 30 sn
- 30 saniye sonrası: `focus`, dikkat yüzü, hedefe doğru yönelme hissi, ses "Buraya bak"; çözümü doğrudan vermez
- öğrenildi kuralı sağlandığında: kısa `stage`, happy_strong, küçük kutlama, ses "Harika gidiyorsun"; sonra zorlaştırma veya yeni set önerisi

Kısa ilke: Pofi göstermez, hatırlatır. Hata büyütülmez, tekrar desteklenir.

### Ayna Pofi Davranışı

- egzersiz başlarken: `normal`, calm_happy, yavaş nefes ve hafif odak, ses "Benim gibi yapalım" veya "Ağzına bak"
- çocuk taklit ederken: `focus`, tek egzersiz yüzü, sabit model, çok hafif nefes
- kamera çocuğu algılarsa: kısa focus artışı, soft_happy, 1.05 büyüme, ses "Gördüm" veya "Evet, böyle"
- kamera yoksa: `focus`, egzersiz yüzü, daha belirgin model gösterimi, ses "Benim gibi yap" veya "Ağzını böyle aç"
- çocuk yapamazsa: `normal`, sabırlı/calm, tekrar gösterim, ses "Bir daha deneyelim" veya "Yavaşça yapalım"
- egzersiz tamamlanınca: kısa `stage`, happy_soft, 1.15 büyüme, hafif glow, 400 ms sonra `normal`, ses "Aferin" veya "Harika"

Kritik kural: Pofi burada eğlendiren karakter değil, gösteren ve bekleyen rehberdir. Egzersiz sırasında aynı anda tek duygu ve tek yüz görünür.

### Uyku Pofi Davranışı

- uyku ekranına girince: Pofi sleepy çizgisinde görünür, hareket minimumdur
- ses başlatılınca: Pofi sleep durumuna geçer
- çocuk ekrana dokunursa: Pofi tepki yarışına girmez; ekran değişmez
- çıkış: özel gesture dışında hiçbir ana ekran/nav davranışı çalışmaz
- anne/baba sesi açılınca: Pofi daha kişisel veya daha hareketli davranmaz; güvenli ve sakin sleep çizgisi korunur
- uyku aktifken presence `hafif` çizgisindedir; Pofi bulut gibi görünür, dikkat çekmez ve kaybolmaz
- ay ve Pofi mekanik düz çizgiyle değil, çok yavaş, doğal ve hissedilir hareketlerle davranır

Kritik kural: Uyku modunda Pofi ve ortam mekanik animasyon gibi değil, doğal gece gökyüzü gibi hissedilmelidir.

## Çocuk Ekranı Anayasası

Bu kurallar opsiyonel değildir.

- her ekranda yalnız 1 görev, 1 mesaj ve 1 görsel odak bulunur
- aynı anda birden fazla görev veya ikinci dikkat odağı sunulmaz
- "yanlış yaptın" gibi başarısızlık dili kullanılmaz
- Pofi üzülebilir, şaşırabilir veya esprili tepki verebilir; ancak negatif geri bildirim vermez
- tercih edilen dil "bir daha deneyelim" ve "hadi birlikte yapalım" çizgisindedir
- metinler mümkün olduğunca 3-4 kelimeyi aşmaz
- sesli yönlendirme ve tek komutlu ifade tercih edilir
- küçük buton kullanılmaz; yanlış dokunma riski azaltılır
- aynı anda yalnız 1 hareketli öğe bulunur
- ani hareket, hızlı blink ve sürpriz UI değişimi kullanılmaz
- aynı aksiyon aynı sonucu, aynı durum aynı tepkiyi üretir
- her akış mümkün olduğunca 2-3 adımda tamamlanır
- ekran "burada güvendeyim, birlikte yapıyoruz" hissi vermelidir

## Ebeveyn Paneli Anayasası

Parent panel yalnız ayar ekranı değildir; ebeveyne güven, kontrol ve anlam sunan rehber alanıdır.

- panelin temel hissi "çocuğum ilerliyor ve doğru yerdeyim" olmalıdır
- veri yorumla birlikte sunulur; yalnız sayı gösterilmez
- her önemli veri kısa öneri üretir
- ebeveyn içerik ekleyebilir, ses kaydı yapabilir ve ilerlemeyi görebilir
- ebeveyn kontrol hisseder ama çocuğun akışını bozacak müdahaleye zorlanmaz
- ilerleme, tekrar ihtiyacı ve kayıt durumu tek bakışta görünür
- gizlilik ve saygı korunur; gereksiz detaydan kaçınılır

## Gelecek Eğitim Katmanları

MinaPlay ileride 0-18 yaş aralığına, okul öncesi ve örgün öğretim desteğine, gönüllü eğitimci ağına ve engelli bireylerin okul süreci desteğine genişleyebilir.

Bu gelecek katmanlar bugünkü 0-5 çocuk yüzeyine karıştırılmaz. Eğitimci, terapist, okul süreci ve raporlama araçları ayrı roller ve ayrı paneller olarak tasarlanmalıdır.

Gelecek sistem ilkesi:

- çocuk basit etkileşim yüzeyini kullanır
- ebeveyn kontrol ve izleme yapar
- terapist planlama ve takip yapar
- gönüllü eğitimciler okul ve ev sürecinde destek ağına dahil olabilir

Gelecek terapi/eğitim modülleri:

- Dil ve Konuşma Terapisi
- Fizyoterapi
- Özel Eğitim
- Floortime
- Ergoterapi

Ev egzersizi sistemi kısa, anlaşılır ve tekrar edilebilir oturumlara dayanmalıdır. Hedef oturum süresi 2-5 dakika aralığında düşünülür.

## Test Kancaları

PWA yüzeyi test edilebilirlik için özel kancalar taşır:

- `window.render_game_to_text`
- `window.advanceTime(ms)`
- DOM data attribute state'leri

Bu kancalar geliştirici doğrulaması içindir. Kullanıcı deneyimini açıklayan ürün metnine dönüştürülmez.

## İçerik Dili

Ürün dili:

- Türkçe
- kısa
- yumuşak
- çocuğa doğrudan ve teşvik edici
- ebeveyne net ve açıklayıcı

Örnek ton:

- `Harika!`
- `Süper!`
- `Bir daha deneyelim.`
- `Hadi dokun.`

## Yakın Web Riskleri

- ebeveyn ayarları çocuk yüzeyini kalabalıklaştırabilir
- Ceee'nin aktif 5. alan mı yoksa kısa oyun alanı mı olduğu görsel olarak net anlatılmazsa ana modlarla karışabilir
- Ayna modunda ödül yüzü egzersiz sırasında erken görünürse akış bozulabilir
- Uyku modunda rastgele duygu state'leri sakinliği bozabilir
- Türkçe karakterleri olmayan metinler ürün kalitesini düşürebilir

## Kısa Kural

Çocuk yüzeyi önce gelir.

Ebeveyn, eğitimci ve terapist araçları ürünü güçlendirir, ama ana çocuk deneyiminin önüne geçmez.
