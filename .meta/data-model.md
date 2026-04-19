---
name: data-model
description: MinaPlay projesinin temel veri yapısını, localStorage alanlarını, Pofi state modelini ve ilişki mantığını tanımlar.
created: 2026-04-17
updated: 2026-04-19
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
- `lastPracticedAt`
- `learned`

Kurallar:

- bir nesne için üst üste 10 doğru cevap `learned` durumunu tetikleyebilir
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
- `tongue`: dil egzersizleri
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
- `pispis`
- `parentRecording`

Kalıcı veri olmaktan çok runtime state olarak yorumlanır.

## Pofi State Modeli

Pofi bir davranışsal etkileşim sistemidir. Pofi state modeli çocuğa gösterilen ifade, egzersiz, rehberlik ve global durumları yönetir.

State kategorileri:

- `emotion`: duygu ifadeleri
- `exercise`: ağız, dil ve yüz egzersizi ifadeleri
- `guide`: oyun içi rehberlik, başarı ve yumuşak yönlendirme
- `state`: global uygulama durumları

Örnek state akışı:

- App start -> `pofi_state_default`
- Bekleme -> `pofi_emotion_neutral`
- Dikkat -> `pofi_emotion_surprised` veya anticipation
- Doğru cevap -> `pofi_guide_success`
- Yumuşak uyarı -> `pofi_emotion_nervous_soft`
- Ayna egzersizi -> `pofi_exercise_teeth_show` veya `pofi_exercise_tongue_out`
- Uyku girişi -> `pofi_emotion_sleepy`
- Uyku aktif -> `pofi_state_sleep`

Kurallar:

- aynı anda tek aktif Pofi state olur
- aynı container içinde Pofi üst üste binmez
- eski gövde katmanları kullanılmaz
- PNG emoji sistemi ana kaynaktır
- Pofi görselleri `/assets/pofi_emoji` altında tutulur
- emotion geçişleri fade/scale ile yumuşak olur
- Touch ve Matching gibi modlarda hızlı duygu değişimi engellenir
- Sleep modunda yalnız sleepy ve sleep durumları kullanılır
- Mirror modunda egzersiz sırasında guide/reward yüzü gösterilmez

## Pofi Presence Modeli

Pofi state modeli tek başına yeterli değildir. V2'de Pofi'nin bir de `presence` seviyesi vardır. Presence; Pofi'nin ekranda ne kadar görünür olduğunu, ne kadar büyük olduğunu ve ne kadar dikkat çektiğini yönetir.

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
- Pofi'nin büyümesi aktiviteyi kalıcı olarak gölgelemez
- Pofi nefes hareketi gibi düşük frekanslı bir presence animasyonu taşıyabilir
- uyku modunda presence `subtle` veya `hidden` çizgisine çekilir; rastgele odak veya sahne davranışı çalışmaz
- aynı anda tek duygu, tek yüz ve tek presence seviyesi olur

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
- Uyku aktif: `hidden` veya yok gibi
- Uyku etkileşimleri: tepki yok, dikkat çekme yok

Örnek davranış:

- idle: `neutral` + `normal`
- çocukdan aksiyon bekleniyor: `attention` + `focus`
- dikkat toplanmadı: kısa süreli `attention` + `stage`
- doğru aksiyon: `softHappy` + `normal`
- yumuşak yönlendirme: `softPrompt` + `focus`
- uyku başlangıç: `sleepy` + `subtle`
- uyku aktif: `sleep` + `hidden`
- 30 saniye tepkisizlik: önce düşünme/yardım ifadesi, sonra gerekirse `stage`
- doğru cevap ödülü: kısa `stage`, 300-500 ms, sonra `normal`
- Eşleme hatırlatma ritmi: 10 sn, 20 sn, 30 sn
- Ayna egzersiz modeli: egzersiz sırasında tek state ve tek yüz

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
