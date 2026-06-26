---
name: data-model
description: MinaPlay projesinin temel veri yapısını, localStorage alanlarını, Pofi state modelini ve ilişki mantığını tanımlar.
created: 2026-04-17
updated: 2026-04-29
---

# Veri Modeli

## Özet

`MinaPlay` veri modeli bugünkü aşamada local-first bir tarayıcı modelidir.

Ana karar:

- merkezi veritabanı yoktur
- hesap veya bulut senkronizasyonu yoktur
- kalıcılık ağırlıklı olarak `localStorage` üstündedir
- ses kayıtları data URL olarak yerelde tutulur
- Pofi state modeli runtime davranış sistemidir
- Pofi presence modeli görünürlük, büyüklük ve dikkat çekme gücünü yönetir
- test edilebilir state DOM attribute'ları ve `render_game_to_text` çıktısıyla görünür yapılır

## Ana Varlıklar

### VocabularyItem

Dokun modundaki kelime veya nesne kartını temsil eder.

Alanlar:

- `word`
- `label`
- `emoji` veya görsel referans
- `repeats`

### SpeechSettings

Ebeveynin tekrar ve dinleme davranışını belirleyen ayardır.

Alanlar:

- `repeatMode`: `default`, `1`, `2`, `3`

Storage key:

- `konusu_yorum_speech_settings_v1`

Not:

- storage key adları ürünleşme sırasında korunacaksa geriye uyumluluk sağlanır
- `minaplay_*` ailesine geçiş yapılacaksa migration gerekir

### CustomAudioMap

Kelime veya cümle için ebeveyn ses kaydını tutan haritadır.

Mantık:

- key normalize edilmiş kelime veya cümledir
- value ses kaydının data URL değeridir
- Dokun, Günlük Kelime, Cümle ve Hikaye modları bu haritayı ortak kullanabilir

Kritik not:

- bu yapı localStorage kapasitesine duyarlıdır
- ileride export/import, IndexedDB veya daha sağlam storage kararı gerekebilir

### ListenProgress

Kelime, cümle, hikaye ve paket dinleme ilerlemesini tutar.

Alanlar:

- `wordListens`
- `sentenceListens`
- `packSentenceListens`
- `packDailyListens`

Storage key:

- `konusu_yorum_listen_progress_v1`

### DailyActivityState

Günlük küçük hedeflerin durumunu tutar.

Alanlar:

- `dateKey`
- `words`
- `stories`
- `interactions`

Storage key:

- `konusu_yorum_daily_activity_v1`

Gün değiştiğinde state sıfırlanır.

### ParentAnalysisSnapshot

Ebeveyn panelinde gösterilecek analiz görünümünü temsil eder.

Bugünkü yorum:

- analitik verinin kalıcı backend modeli henüz yoktur
- localStorage ve test state üzerinden özet çıkarılabilir
- çocuk yüzeyinde görünmez, Parent panelde okunur

İzlenebilecek alanlar:

- hangi modda ne oynandı
- yapılan görevler
- doğru denemeler
- yanlış veya hedef dışı denemeler
- tamamlanan egzersizler
- tekrar sayısı
- oturum sıklığı
- son kullanım zamanı
- kelime/nesne bazlı ardışık doğru sayısı
- kelime/nesne bazlı son 5 deneme sonucu
- öğrenildi kabul edilen kartlar
- yeni kart/nesne önerisi gerektiren alanlar
- 30 saniye tepkisizlik gibi dikkat toplama olayları

### LearningCardProgress

Dokun ve Eşleme modlarında kelime veya nesne bazlı öğrenme durumunu temsil eder.

Alanlar:

- `itemId`
- `correctCount`
- `wrongOrOffTargetCount`
- `consecutiveCorrectCount`
- `recentResults`
- `lastPracticedAt`
- `learned`

Kurallar:

- öğrenildi durumu için MVP kuralı: son 5 denemede en az 4 doğru ve ardışık doğru sayısı en az 3 olmalıdır
- öğrenildi kabul edilen nesne Parent panelde yeni kart/nesne ekleme önerisine dönüşebilir
- yanlış veya hedef dışı denemeler başarısızlık olarak değil, tekrar ve yönlendirme ihtiyacı olarak yorumlanır

### AttentionEvent

Çocuğun belirli süre tepki vermediği veya Pofi'nin dikkat toplama davranışı ürettiği anı temsil eder.

Alanlar:

- `mode`
- `itemId`
- `elapsedMs`
- `pofiState`
- `pofiPresence`
- `soundCue`

Kural:

- 10 saniye tepkisizlik hafif yardım ve kelime tekrarını tetikler
- 20 saniye tepkisizlik ikinci hatırlatma olarak yorumlanır
- 30 saniye tepkisizlik Pofi'nin düşünme, yardım etme, odak veya sahne presence davranışını tetikleyebilir
- bu kayıt çocuğa başarısızlık olarak gösterilmez; Parent panelde dikkat ve tekrar ihtiyacı olarak yorumlanabilir

### PofiBehaviorRule

Pofi'nin mod, olay, state, presence, ses ve animasyon kararını temsil eder.

Alanlar:

- `mode`
- `event`
- `stateId`
- `presence`
- `animation`
- `durationMs`
- `soundCue`
- `nextPresence`

MVP olayları:

- `enter_mode`
- `target_selected`
- `correct`
- `wrong_or_offtarget`
- `idle_10s`
- `idle_20s`
- `idle_30s`
- `three_misses`
- `consecutive_success`
- `exercise_start`
- `exercise_detected`
- `exercise_no_camera`
- `exercise_complete`
- `sleep_sound_started`

Kurallar:

- doğru cevap kısa ödül üretir, abartılı kutlama üretmez
- yanlış veya hedef dışı deneme yargısız yönlendirme üretir
- 3 kez bilememe öğretme/highlight akışını tetikleyebilir
- üst üste başarı ilerleme hissi verir
- sesli uyaranlar kısa, yumuşak ve bağırmayan tondadır

### ExercisePlan

Ayna modundaki egzersiz sırasını ve çalışma grubunu temsil eder.

Gruplar:

- `emotion`: duygu durumu, mimik ve emoji taklidi
- `mouth`: güvenli ağız açıklığı ve ses egzersizleri
- `lip`: dudak egzersizleri
- `face`: yüz egzersizleri

Kurallar:

- egzersiz sıralaması Parent panelden belirlenebilir
- kamera varsa ölçüm desteklenebilir
- kamera yoksa egzersiz görsel anlatım ve süre/tekrar akışıyla devam eder

### SleepPlan

Uyku modundaki ses, süre ve kayıt tercihlerini temsil eder.

Alanlar:

- `soundType`
- `durationMinutes`
- `customRecordingId`
- `touchLockEnabled`
- `exitGesture`

Ses adayları:

- `ocean`
- `nature`
- `vacuum`
- `whiteNoise`
- `lullaby`
- `parentRecording`

Kurallar:

- uyku modunda çocuk kazara dokunsa bile ekran değişmez
- çıkış kontrollü gesture ile yapılır
- ses açıldığında Pofi sleepy durumundan sleep durumuna geçer

### StoryLevel

Hikaye zorluğunu belirtir.

Değerler:

- `easy`
- `standard`

`easy` seviyesi iki kelimelik veya kolay algılanır cümleler için kullanılır.

### StoryPack

Hikaye içerik paketini belirtir.

Değerler:

- `core`
- `animals`
- `daily`

### StoryItem

Hikaye veya cümle pratiği setini temsil eder.

Alanlar:

- `id`
- `title`
- `emoji` veya görsel referans
- `sentences`

İlişki:

- `StoryLevel -> StoryPack -> StoryItem[]`

### CustomEasySentence

Ebeveynin kolay seviyeye eklediği iki kelimelik veya basit cümledir.

Storage key:

- `konusu_yorum_easy_sentences_v1`

Kurallar:

- duplicate girişler engellenir
- özel cümle varsa ilgili özel içerik grubu dinamik olarak görünür

### FamilyMember

Aile avatarı kaydını temsil eder.

Alanlar:

- `id`
- `name`
- `color`
- `photoDataUrl`
- `createdAt`

Storage key:

- `konusu_yorum_family_members_v1`

### SleepSound

Uyku modu ses türünü temsil eder.

Değerler:

- `white`
- `rain`
- `wind`
- `ocean`
- `vacuum`
- `heartbeat`
- `parentRecording`

Kalıcı veri olmaktan çok runtime state olarak yorumlanır.

## Pofi State Modeli

Pofi V2 role-first bir davranış motorudur. Sistem doğrudan emotion adıyla state tutmaz; önce davranış rolünü belirler, sonra bu rol uygun assetKey'e çözülür.

```ts
type PofiRole =
  | "idle"
  | "attention"
  | "success"
  | "error_soft"
  | "empathy"
  | "sleep"
  | "play"
  | "exercise";

type PofiPresence =
  | "hidden"
  | "subtle"
  | "normal"
  | "focus"
  | "stage";

interface PofiState {
  module: PofiModule;
  role: PofiRole;
  presence: PofiPresence;
  assetKey: string;
  locked: boolean;
  updatedAt: number;
}
```

Kurallar:

- aynı anda tek aktif Pofi state olur
- aynı container içinde Pofi üst üste binmez
- PNG sistemi ana kaynaktır
- Pofi assetleri `poses` ve `parts` kategori klasörlerinde tutulabilir
- `parts` sistemi serbest kombinasyon sistemi değildir; role-first kararın seçtiği gövde, göz, ağız ve el katmanlarını deterministik biçimde çözer
- el, göz ve ağız katmanları yalnız davranış anlamı taşıyan durumlarda değişir
- el katmanı opsiyoneldir; her state el göstermek zorunda değildir
- el görünüyorsa yüzün üst katmanında durur ve rehberlik anlamını net taşır
- point el assetleri transient davranır; `pofi_hand_point_left_v01` ve `pofi_hand_point_right_v01` 1-2 saniyelik hedef ipucu olarak gösterilip otomatik gizlenir
- sistem deterministiktir; MVP'de random asset seçimi yoktur
- idle davranışında rastgele duygu veya el hareketi seçilmez
- göz/mimik geçişleri kısa tutulur; uzun blur etkisi mizaç netliğini zayıflatır
- blink role/state geçişi değildir; yalnız göz katmanı değişir, gövde life-motion ve role sabit kalır
- Touch ve Matching gibi modlarda hızlı state değişimi engellenir
- Mirror modunda egzersiz sırasında `locked = true` çalışır
- Sleep modunda yalnız sleep ailesi davranışı kullanılır

## Pofi Mizaç Modeli

Pofi'nin davranış modeli çocuk rehberliği için sakin ve tutarlı olmalıdır. Asset çözümü yalnız görsel dosya seçimi değildir; çocuğun ne yapacağını anlamasına yardım eden mizaç katmanıdır.

Role karşılıkları:

- `idle`: bekleyen, güven veren, düşük uyarımlı Pofi
- `welcome`: canlı ama güvenli karşılama yapan Pofi
- `attention`: hedefe bakmayı veya dokunmayı hatırlatan Pofi
- `success`: kısa ve yumuşak onay veren Pofi
- `error_soft`: yanlış/hatalı değil, tekrar denemeye çağıran Pofi
- `empathy`: çocuğu sakin tutan, baskı kurmayan Pofi
- `sleep`: dikkat çekmeyen, uykuya eşlik eden Pofi
- `play`: Ceee gibi oyunlarda kontrollü neşe taşıyan Pofi
- `exercise`: taklit edilecek tek modeli gösteren Pofi

Mizaç kuralları:

- her role tek ana niyet taşır
- aynı anda hem kutlama hem yönlendirme gibi iki anlam verilmez
- yanlışta üzgün yüz kullanılmaz; yumuşak işaret ve sakin ağız tercih edilir
- başarıda abartılı zıplama veya taşkın mimik yoktur
- Ceee dışında oyunbazlık sınırlıdır
- Ayna'da egzersiz süresince ifade ve jest kilitli kalır
- Uyku'da blink/nefes dışında dikkat toplayan hareket yoktur
- Pofi'nin hareketi çocuğun beklenen aksiyonunu açıklamıyorsa kullanılmaz
- `blush-soft-v01.png` standart sıcaklık efekti olarak kullanılabilir; `attention` ve `success` rollerinde daha belirgin görünebilir
- happy kaş pozitif/rehber rollerinde standarttır; sad kaş yanlışta çocuğa başarısızlık hissi verebileceği için MVP'de kullanılmaz
- Pofi blink aralığı 3-7 saniye arasında tutulur
- Pofi life-motion gövde seviyesinde yaklaşık onda birlik konum hareketi, `0.95-1.05` ölçek nefesi ve hafif rotasyon taşıyabilir
- role sakinleştikçe gövde süzülmesi yavaşlar; hızlı hareket denemelerinin yaklaşık üçte biri hızında tutulur
- yüz katmanları, ağız/göz/kaş birlikte olacak şekilde gövde hareket limitinin yaklaşık beşte biri kadar takip hareketi yapabilir

## Pofi Presence Modeli

Pofi state modeli role + presence + assetKey üzerinden çalışır. Modüller bu state'i doğrudan yönetmez; yalnız olay gönderir. Merkezi Pofi sistemi olayları yorumlar ve tek global state üretir.

Presence seviyeleri:

- `hidden`: gizli, görünmez
- `subtle`: hafif, küçük ve arka planda
- `normal`: rehber seviyesinde
- `focus`: odak, biraz büyür ve dikkat çeker
- `stage`: sahne, kısa süreli büyük ve baskın görünür

Temel kurallar:

- aynı anda tek aktif Pofi state ve tek aktif presence seviyesi olur
- presence seviyesi mod, dikkat ihtiyacı ve çocuğun beklenen aksiyonu ile ilişkilidir
- `stage` seviyesi kısa sürelidir ve sonra `normal` veya `subtle` seviyesine döner
- `stage` süresi 400 ms sabit kabul edilir
- Pofi'nin büyümesi aktiviteyi kalıcı olarak gölgelemez
- Pofi nefes hareketi gibi düşük frekanslı bir presence animasyonu taşıyabilir
- uyku modunda presence `subtle` çizgisine çekilir; Pofi bulut gibi görünür ama rastgele odak veya sahne davranışı çalışmaz
- aynı anda tek rol, tek yüz ve tek presence seviyesi olur

Mod bazlı presence matrisi:

- Dokun başlangıç: `subtle -> normal`
- Dokun hedef verildiğinde: `focus`
- Dokun doğru cevap: kısa `stage`, sonra `normal`
- Dokun yanlış cevap: `normal`
- Dokun bekleme: `focus`
- Eşleme başlangıç: `subtle`
- Eşleme hedef gösterildiğinde: `focus`
- Eşleme doğru eşleme: kısa `stage`
- Eşleme yanlış: `normal`
- Eşleme bekleme: `focus`
- Ayna başlangıç: `normal`
- Ayna egzersiz sırasında: `focus`
- Ayna taklit sırasında: `focus`, tek yüz ve sabit model
- Ayna yapamazsa: `normal`
- Ayna tamamlanınca: kısa `stage`
- Uyku başlangıç: `subtle`
- Uyku aktif: `subtle`, bulut gibi görünür ama dikkat çekmez
- Uyku etkileşimleri: tepki yok, dikkat toplama yok

Event -> role örnekleri:

- `APP_START` -> `idle + subtle`
- `TARGET_SHOWN` -> `attention + focus`
- `CORRECT` -> `success + stage`
- `WRONG` -> `error_soft + normal`
- `REPEAT_FAIL_3` -> `empathy + normal`
- `MIRROR_MODEL` -> `exercise + focus`
- `SLEEP_ACTIVE` -> `sleep + subtle`
- `CEEE_HIDE` -> `play + subtle`

## Pofi Asset Modeli

V2 asset sistemi kategoriye ayrılır.

Klasörler:

- `assets/pofi/emotion`
- `assets/pofi/exercise`
- `assets/pofi/sleep`
- `assets/pofi/play`

Dosya adı standardı:

- `pofi_<category>_<name>.png`

Asset key standardı:

- `emotion.<name>`
- `exercise.<name>`
- `sleep.<name>`
- `play.<name>`

Kategori kuralları:

- Home, Dokun, Eşleme -> yalnız `emotion.*`
- Ayna -> yalnız `exercise.*`
- Uyku -> yalnız `sleep.*`
- Ceee -> yalnız `play.*`
- aynı PNG iki kategoriye atanmaz
- Mirror modunda random seçim yoktur; `exerciseId -> assetKey` düz çözülür

## Parent Panel MVP Modeli

Parent Panel MVP karmaşık analiz üretmez; basit ve anlamlı özet verir.

MVP alanları:

- kelime/nesne bazlı deneme sayısı
- doğru sayısı
- ardışık doğru sayısı
- son 5 deneme özeti
- öğrenildi durumu
- günlük kısa özet
- temel set seçimi

Öğrenildi kuralı:

- son 5 denemede en az 4 doğru
- ardışık doğru sayısı en az 3

Panel dili:

- ham veri tek başına gösterilmez
- her metrik kısa yorum veya öneriyle sunulur
- karmaşık grafik ve ileri analiz MVP dışında kalır

## Egzersiz Sistemi

Ayna modunda Pofi egzersiz gösterir, çocuk taklit eder. Katı algılama yoktur; tekrar ve zaman bazlı ödül vardır.

Ağız:

- A açık
- O yuvarlak
- E geniş

Dudak:

- öpücük
- gülümseme
- germe

Dil:

- dışarı
- sol
- sağ
- yukarı

Kurallar:

- Pofi gösterir
- çocuk taklit eder
- tekrar bazlı ilerler
- negatif geri bildirim verilmez

## Test State Modeli

`render_game_to_text` aşağıdaki state alanlarını JSON olarak dışarı verir:

- `active_view`
- `pofi_state`
- `daily_activity`
- `touch`
- `match`
- `sentence`
- `story`
- `mirror`
- `sleep`
- `peekaboo`
- `parent`
- `parent_analysis`

Bu model ürünün gerçek veri modeli değildir; test ve gözlem yüzeyidir.

## Owner ve Sorumluluk

Bugünkü owner ayrımı:

- seed içerikler kod içinde veya statik data dosyalarında yaşar
- kullanıcı/ebeveyn tarafından üretilen veriler localStorage içindedir
- Pofi state runtime davranış sistemidir
- Pofi presence runtime sahne/görünürlük sistemidir
- server kalıcı veri owner'ı değildir
- Railway deploy yalnız servis yüzeyidir
- export/import akışları yerel veriyi taşımak için yardımcıdır

## Gelecek Veri Adayları

MinaPlay ileride 0-18 yaş aralığına, okul öncesi ve örgün öğretim desteğine büyürse şu varlıklar gerekebilir:

- öğrenci/çocuk profili
- ebeveyn profili
- gönüllü eğitimci rolü
- terapist/eğitimci rolü
- okul süreci takip kaydı
- kişiselleştirilmiş plan
- günlük görev
- haftalık hedef
- tekrar ve oturum geçmişi
- doğru/yanlış deneme geçmişi
- tamamlanan egzersizler
- raporlama çıktısı

Bu adaylar bugünkü local-first çekirdeğin kapsamına alınmaz.

## Veri Modeli Riskleri

- localStorage kapasitesi ses kayıtları için sınırlıdır
- aynı cihazda farklı çocuk profili ayrımı henüz net değildir
- kayıtların yedeği kullanıcı alışkanlığına bağlıdır
- normalize edilen Türkçe metinlerde karakter ve telaffuz hassasiyeti dikkat ister
- Pofi state çakışmaları üst üste render veya yanlış mod tepkisi üretebilir
- ileride hesap veya cloud sync gelirse mevcut storage key'lerin migration planı gerekir

## Yakın Model Kararları

Açık adaylar:

- çocuk profili kavramı eklenecek mi
- ses kayıtları localStorage yerine IndexedDB'ye taşınacak mı
- story pack içeriği koddan ayrı JSON veya admin yüzeyine alınacak mı
- Pofi state geçişleri merkezi bir state manager ile mi yönetilecek
- ilerleme verisi ileride backend'e senkronize edilecek mi

Bugünkü karar:

- bu sorular erken genişletilmez
- çalışan local-first model korunur
- teknik borç görünür tutulur
