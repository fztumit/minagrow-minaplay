---
name: data-model
description: MinaPlay projesinin temel veri yapısını, localStorage alanlarını, Pofi state modelini ve ilişki mantığını tanımlar.
created: 2026-04-17
updated: 2026-04-18
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
