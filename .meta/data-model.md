---
name: data-model
description: MinaGrow/MinaPlay projesinin temel veri yapısını, localStorage alanlarını, ana varlıklarını ve ilişki mantığını tanımlar.
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
- test edilebilir state DOM attribute'ları ve `render_game_to_text` çıktısıyla görünür yapılır

## Ana Varlıklar

### VocabularyItem

Konuşma oyunundaki kelime kartını temsil eder.

Alanlar:

- `word`
- `label`
- `emoji`
- `repeats`

Bugünkü kelime seti:

- `su`
- `anne`
- `baba`
- `top`
- `araba`
- `kitap`
- `elma`
- `süt`
- `ekmek`

Özel kural:

- `su` varsayılan olarak 3 tekrar taşır

### SpeechSettings

Ebeveynin tekrar davranışını belirleyen ayardır.

Alanlar:

- `repeatMode`: `default`, `1`, `2`, `3`

Storage key:

- `konusu_yorum_speech_settings_v1`

### CustomAudioMap

Kelime veya cümle için ebeveyn ses kaydını tutan haritadır.

Mantık:

- key normalize edilmiş kelime veya cümledir
- value ses kaydının data URL değeridir
- konuşma oyunu, günlük kelime ve hikaye modülü bu haritayı ortak kullanır

Kritik not:

- bu yapı localStorage kapasitesine duyarlıdır
- ileride export/import veya daha sağlam storage kararı gerekebilir

### ListenProgress

Kelime ve cümle dinleme ilerlemesini tutar.

Alanlar:

- `wordListens`
- `sentenceListens`
- `packSentenceListens`
- `packDailyListens`

Storage key:

- `konusu_yorum_listen_progress_v1`

Kullanıldığı yerler:

- konuşma oyunu kelime dinlemeleri
- hikaye cümle dinlemeleri
- paket ilerleme özeti
- haftalık paket momentumu

### DailyActivityState

Günlük küçük hedeflerin durumunu tutar.

Alanlar:

- `dateKey`
- `words`
- `stories`
- `interactions`

Storage key:

- `konusu_yorum_daily_activity_v1`

Hedef mantığı:

- 3 farklı kelime
- 1 hikaye/cümle
- 1 etkileşim

Gün değiştiğinde state sıfırlanır.

### StoryLevel

Hikaye zorluğunu belirtir.

Değerler:

- `easy`
- `standard`

`easy` seviyesi iki kelimelik cümleler için kullanılır.

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
- `emoji`
- `sentences`

İlişki:

- `StoryLevel -> StoryPack -> StoryItem[]`

### CustomEasySentence

Ebeveynin kolay seviyeye eklediği iki kelimelik cümledir.

Storage key:

- `konusu_yorum_easy_sentences_v1`

Kurallar:

- yalnız iki kelime kabul edilir
- duplicate girişler engellenir
- özel cümle varsa `Özel Cümleler` hikayesi dinamik olarak görünür

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

Not:

- fotoğraf seçilmezse SVG tabanlı fallback avatar üretilir

### DailyWord

Günün kelimesidir.

Mantık:

- mevcut tarihten deterministik index hesaplanır
- vocabulary listesi içinde gün bazlı döner
- ebeveyn sesi varsa özel kayıt oynatılabilir

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

### MascotState

Maskotun mesaj ve varyant durumunu temsil eder.

Bugünkü kullanım:

- çocuk için kısa yönlendirme mesajı
- uyku modunda görsel varyant
- başarı veya tekrar mesajları

Kalıcı veri değildir.

## Test State Modeli

`render_game_to_text` aşağıdaki state alanlarını JSON olarak dışarı verir:

- `active_view`
- `mascot_message`
- `daily_word`
- `daily_word_audio`
- `daily_activity`
- `speech`
- `sleep`
- `family`
- `stories`

Bu model ürünün gerçek veri modeli değildir; test ve gözlem yüzeyidir.

## Owner ve Sorumluluk

Bugünkü owner ayrımı:

- vocabulary ve story seed içeriği kod içindedir
- kullanıcı/ebeveyn tarafından üretilen veriler localStorage içindedir
- server kalıcı veri owner'ı değildir
- Railway deploy yalnız servis yüzeyidir
- export/import akışları yerel veriyi taşımak için yardımcıdır

## Veri Modeli Riskleri

- localStorage kapasitesi ses kayıtları için sınırlıdır
- aynı cihazda farklı çocuk profili ayrımı henüz net değildir
- kayıtların yedeği kullanıcı alışkanlığına bağlıdır
- normalize edilen Türkçe metinlerde karakter ve telaffuz hassasiyeti dikkat ister
- ileride hesap veya cloud sync gelirse mevcut storage key'lerin migration planı gerekir

## Yakın Model Kararları

Açık adaylar:

- çocuk profili kavramı eklenecek mi
- aile üyesi ile çocuk profili ayrılacak mı
- ses kayıtları localStorage yerine IndexedDB'ye taşınacak mı
- story pack içeriği koddan ayrı JSON veya admin yüzeyine alınacak mı
- ilerleme verisi ileride backend'e senkronize edilecek mi

Bugünkü karar:

- bu sorular erken genişletilmez
- çalışan local-first model korunur
- teknik borç görünür tutulur
