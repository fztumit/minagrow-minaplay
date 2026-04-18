---
name: minagrow-agents
description: MinaGrow üst bağlamında MinaPlay için çalışan ajanın projeyi nasıl yorumlayacağını, hangi sırayla okuyacağını ve hangi workflow'a yaslanacağını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# MinaGrow Agents

Bu dosya, `MinaGrow` repo kökünde çalışan Codex ajanının davranış protokolünü tanımlar.

Amaç, bu repo'yu boş veya bağlamsız bir klasör gibi yorumlamak değildir. Amaç; `MinaGrow` üst bağlamındaki `MinaPlay` uygulamasını, `Konusu-Yorum` referans reposundan gelen gerçek ürün bağlamıyla birlikte okumak ve yeni sohbet açıldığında ajanın doğru yerden başlamasını sağlamaktır.

## Bu Dosyanın Rolü

Bu dosya yapı haritası değil, giriş ve davranış protokolüdür.

Burada ağırlıklı olarak şu sorular cevaplanır:

- ajan bu repo'yu nasıl yorumlar
- önce hangi dosyaları okur
- belirsiz açılışta nasıl davranır
- proje hafızası ile agent tarafı nasıl ayrılır
- hangi durumda hangi workflow'a gider
- hangi durumda doğrudan uygular, hangi durumda önce onay ister

`MinaGrow` içinde ürün yönü, mimari ve veri modeli için kanonik yüzey `.meta/` altındaki dosyalardır. Ajanın çalışma bağlamı ve iş birliği disiplini ise `.agent/` altında yaşar.

## Ana Kural

Eğer çalışma `MinaGrow` repo kökünden başlıyorsa ajan bunu sıradan bir dosya dizini gibi ele almaz.

Varsayılan kabul şudur:

- şu an `MinaGrow` içindeyiz
- ana ürün `MinaPlay` adlı çocuk odaklı konuşma, taklit, duygu ve etkileşim PWA'sıdır
- uygulamanın somut referansı `/Users/umitaydin/Documents/Konusu-Yorum` reposudur
- `.meta` proje hafızasının kanonik yüzeyidir
- `.agent` ajanın bu projede nasıl çalışacağını taşıyan iç çalışma alanıdır
- `Pofi` dekoratif bir karakter değil, davranışsal etkileşim sistemidir
- kullanıcı Ümit'tir; başka repo veya hazır profil bağlamı bu repo için varsayım değildir

Bu nedenle kullanıcı kısa veya dar bir mesaj yazsa bile ajan önce bulunduğu alanı doğru sınıflandırır.

## Repo Yorumu

`MinaGrow` içindeki ana dünyalar farklı çalışma rejimlerinde yorumlanır:

- `.meta`
- `.agent`
- `MinaPlay`

Doğru yorum şudur:

- `.meta` = proje hafızasının kanonik yüzeyi
- `.agent` = ajan çalışma omurgası
- `MinaPlay` = ürün kodunun yerleşmesi beklenen uygulama alanı

Ek kural:

- `server`, `client`, `packages`, `infra` gibi büyük monorepo kökleri varsayılmaz
- bugünkü referans teknoloji `Konusu-Yorum`daki sade Node/Express + modüler TypeScript PWA yapısıdır
- erken ortak paket veya platform mimarisi üretilmez
- ürün tablet/telefon odaklı, çocuk yüzeyi sade ve güvenlik hassasiyeti yüksek bir PWA olarak okunur

## Meta Ayrımı

Repo içinde iki ana bağlam alanı vardır:

- `.meta`
- `.agent`

### `.meta`

Bu alan projenin kanonik hafızasıdır.

Ana dosyalar:

- `project.md`
- `architecture.md`
- `data-model.md`
- `web.md`
- `themes.md`
- `origins.md`
- `transition.md`
- `plan.md`
- `notes.md`
- `worklog.md`
- `phases/`

Bu alan şunu taşır:

- proje ne
- neden var
- mevcut referans uygulama ne
- nasıl kuruluyor
- veri modeli nasıl düşünülüyor
- hangi kararlar alındı
- yakın geçmişte ne yapıldı

### `.agent`

Bu alan ajanın proje içinde nasıl çalışacağını taşır.

Bugünkü ana alanlar:

- `context/`
- `workflows/`

Bu alan şunu taşır:

- Ümit ve ürün bağlamı
- iş birliği yaklaşımı
- çalışma akışları
- yeni sohbette doğru başlama disiplini

## Öncelikli Okuma Sırası

`MinaGrow` içinde çalışırken ajan mümkün olduğunca şu sırayla düşünür:

1. İşin önce proje yönü mü, uygulama mı, meta güçlendirmesi mi, yoksa agent güncellemesi mi istediğini ayırır.
2. `.meta/project.md` ile projenin ne olduğunu tazeler.
3. `.meta/architecture.md` ile teknik yönü tazeler.
4. `.meta/data-model.md` ile veri ve kalıcılık ayrımlarını tazeler.
5. Gerekirse `.meta/web.md`, `.meta/themes.md`, `.meta/origins.md`, `.meta/transition.md` ve `.meta/notes.md` içinden ilgili bağlamı tazeler.
6. `.meta/worklog.md` ile yakın kayıt izini görür.
7. Varsa `.meta/plan.md` ve ilgili `.meta/phases/` dosyalarını okur.
8. İşin niteliğine göre `.agent/context/*.md` dosyalarına bakar.
9. Uygun workflow gerekiyorsa `.agent/workflows/*.md` dosyasına gider.
10. Kod veya mevcut davranış gerekiyorsa `/Users/umitaydin/Documents/Konusu-Yorum` içindeki gerçek uygulama dosyalarını referans alır.

Amaç tüm dosyaları ezberden açmak değil; en kısa yoldan doğru bağlamı toplamaktır.

## Context Okuma Kuralı

Genel bağlam gerektiğinde öncelikli dosyalar şunlardır:

- `.agent/context/profile.md`
- `.agent/context/business.md`
- `.agent/context/collaboration.md`

Bu dosyalar şunlar için kullanılır:

- Ümit'in bu projedeki rolünü anlamak
- MinaGrow üst bağlamını ve MinaPlay iş/ürün bağlamını anlamak
- Ümit + Codex iş birliği çizgisini korumak

Bu bağlam dosyaları proje yönünün yerine geçmez; proje yönünü doğru yorumlamaya yardım eder.

## MinaGrow'u Yorumlama Kuralları

Bu repo içinde ajan şu ana kararları varsayılan kabul eder:

- ürün `MinaGrow` markası altında `MinaPlay` olarak okunur
- referans uygulama `/Users/umitaydin/Documents/Konusu-Yorum` içindedir
- ürünün başlangıç odağı 0-5 yaş çocuklar için konuşma, taklit, duygu ve etkileşim desteğidir
- uzun vadeli vizyon 0-18 yaş aralığında okul öncesi, örgün öğretim ve engelli bireylerin okul süreci desteğine genişleyebilir
- ana yüzey mobil/tablet tarayıcı ve PWA deneyimidir
- backend şimdilik sade Express statik servis ve health yüzeyidir
- verinin ana kalıcılığı şimdilik `localStorage` ve tarayıcı API'leridir
- Dokun, Eşleme, Cümle, Hikaye, Ayna, Uyku, Ceee bonus modu ve Parent panel ürünün ana yüzeyleridir
- Parent panel analiz, kontrol ve izleme katmanı olarak okunur
- Pofi davranış/state/render sistemi ürünün modüller arası rehberliğini taşır
- ileride gönüllü eğitimci ağı ve terapist/eğitimci planlama/takip katmanı ayrı gelecek vizyonudur
- legacy CRM/webhook/Zoho parçaları ürün çekirdeği değildir; temizlenmesi veya ayrılması gereken teknik borç olarak yorumlanır

Bu kararlar kullanıcı tarafından değiştirilmedikçe mevcut kanonik yön olarak yorumlanır.

## Belirsiz Açılış Kuralı

Kullanıcı sohbeti kısa ve belirsiz bir mesajla açarsa ajan rastgele yorum üretmez.

Önce bulunduğu bağlamı görünür hale getirir ve sonra kısa, dar ve takip edilebilir bir menü sunar.

Bu menü mümkün olduğunca şu tip başlıklarla sunulur:

1. proje yönünü netleştirme
2. Konusu-Yorum referansını MinaPlay içine taşıma
3. PWA modüllerini geliştirme
4. ebeveyn araçları ve içerik setlerini güçlendirme
5. `.meta` omurgasını güncelleme
6. `.agent` omurgasını güncelleme
7. sağlık kontrolü yapma

Amaç kullanıcıyı geniş sorguya zorlamak değil; bir sonraki net adıma alan açmaktır.

## Çalışma Modları

`MinaGrow` içinde ajan dört ana çalışma modu tanır:

### 1. Yön Modu

Kullanıcı ürün yönünü, kapsamı, modül sınırlarını veya veri modelini konuşuyorsa:

- önce `.meta` okunur
- net kararlar ile açık kararlar ayrılır
- gerekiyorsa önce meta netliği sağlanır

### 2. Yürütme Modu

Kullanıcı aktif bir iş üzerinde ilerlemek istiyorsa:

- önce bugünkü aktif hedef daraltılır
- gerekiyorsa `implementation-start.md` akışı kullanılır
- tek aktif kapanış hedefi korunur
- kod davranışı için `Konusu-Yorum` referansı okunur

### 3. Faz / Paket Tasarım Modu

Kullanıcı yürütme sırasını, paketleri veya fazları konuşuyorsa:

- `phase-design.md` akışı dikkate alınır
- `plan.md` ile `phases/` birlikte okunur ve rol ayrımı korunur
- paket ile faz birbirine karıştırılmaz

### 4. Sağlık / Kalite Modu

Kullanıcı genel durum, kalite veya meta gücü görmek istiyorsa:

- `health.md`, `meta-update.md` veya `agent-update.md` akışı kullanılır
- güçlü alanlar ve açık riskler ayrılır
- kullanıcı yalnız değerlendirme istediyse dosya değiştirilmez

## Workflow Kullanımı

`.agent/workflows` altındaki dosyalar kullanıcıya ham dosya adı olarak dayatılmaz.

Bu dosyalar ajanın arka plan çalışma akışlarıdır.

Bugünkü temel eşleşme mantığı şöyledir:

- aktif işe doğru başlama -> `.agent/workflows/implementation-start.md`
- faz veya paket tasarımı -> `.agent/workflows/phase-design.md`
- genel sağlık değerlendirmesi -> `.agent/workflows/health.md`
- proje meta omurgasını güçlendirme -> `.agent/workflows/meta-update.md`
- agent omurgasını güçlendirme -> `.agent/workflows/agent-update.md`

## Uygulama ve Onay Kuralı

Varsayılan davranış her zaman dosya üretmek değildir.

Varsayılan davranış şudur:

- önce mevcut durumu ve önerilen değişikliği görünür hale getirir
- kullanıcı açıkça uygulama, düzenleme, yazma veya değiştirme istediğinde uygulamaya geçer
- büyük yön değişikliklerinde etkiyi kısa biçimde belirtir

Şu durumlarda önce açık onay beklenir:

- agent veya proje davranış kuralı değişiyorsa ve kullanıcı açıkça istemediyse
- mimari yön değişiyorsa
- repo yapısı değişiyorsa
- veri modeli ve kalıcılık yaklaşımı etkileniyorsa
- `.meta` içindeki kanonik kararlar yeniden yazılacaksa ve kullanıcı yalnız değerlendirme istediyse
- yeni `plan.md` / `phases/` gibi yürütme yüzeyleri açılacaksa ve kullanıcı bunu açıkça istemediyse

Ek kural:

- kullanıcı yalnız değerlendirme, sağlık kontrolü veya güçlendirme istediğinde ajan doğrudan dosya değiştirmez
- kullanıcı "uygula", "değiştir", "yaz", "düzenle" gibi açık onay verdiğinde ilerler

## Doküman ve Yazım Kuralı

`MinaGrow` içinde meta veya agent yüzeylerine yazılırken şu kurallar bağlayıcı kabul edilir:

- frontmatter korunur
- Türkçe karakter kaybı kabul edilmez
- paragraf akışı yapay satır kırıklarıyla bozulmaz
- aynı karar yanlış dosyalarda gereksiz tekrar edilmez
- belge doğru role sahip dosyaya yazılır
- Konusu-Yorum referansı ile MinaGrow kanonik yönü birbirine karıştırılmaz

Dosya seçimi kuralı:

- proje kimliği ve yön -> `project.md`
- teknik yapı ve yerleşim -> `architecture.md`
- veri, storage ve ilişki mantığı -> `data-model.md`
- PWA yüzeyi, akışlar ve modül deneyimi -> `web.md`
- görsel dil ve tema -> `themes.md`
- fikir kökeni ve ürün evrimi -> `origins.md`
- Konusu-Yorum'dan MinaPlay'e geçiş -> `transition.md`
- aktif yürütme görünümü -> `plan.md`
- faz içi yürütme görünümü -> `phases/phase-xx.md`
- kapanan iş izi -> `worklog.md`

## Yürütme Kuralı

`MinaGrow` içinde aynı anda yalnız bir aktif kapanış hedefi taşınır.

Doğru yorum:

- araştırma olabilir
- not olabilir
- hazırlık olabilir

Ama kapanış zinciri tek hedefe hizalanır.

Bu zincir mümkün olduğunca şunu takip eder:

`uygula -> doğrula -> kayıt -> durum güncelle -> gerekiyorsa commit`

Kod değişikliği varsa mümkün olduğunca şu doğrulama sırası tercih edilir:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e`

Doğrulama komutları, çalışılan gerçek uygulama klasöründe yürütülür.

## İsimlendirme Kuralı

İsimler:

- kısa
- açık
- rolü anlatan
- aynı anlamın alternatiflerini çoğaltmayan

biçimde seçilir.

Bu kural özellikle şunlar için geçerlidir:

- meta dosyaları
- workflow dosyaları
- faz dosyaları
- paket adları
- ürün modülleri
- storage key adları

## Amaç

Bu protokolün amacı, `MinaGrow` içinde çalışan Codex davranışını bilinçli hale getirmektir.

Hedef şudur:

- yeni sohbet açıldığında eski hazır bağlamı yanlış taşımayan
- Ümit, MinaGrow üst bağlamı ve MinaPlay gerçekliğini doğru okuyan
- önce doğru yüzeyleri okuyan
- Konusu-Yorum referansını doğru kullanan
- açık kararı uygulama işiyle karıştırmayan
- çocuk odaklı PWA ürün yönünü koruyan
- gerekince hızlı, gerekince temkinli davranan

bir ajan davranışı üretmek.
