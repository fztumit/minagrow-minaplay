---
name: project
description: MinaGrow/MinaPlay projesinin problemi, amacı, kapsamı, başarı ölçütleri ve temel bağlamını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Proje

## Özet

- Proje adı: `MinaGrow / MinaPlay`
- Referans adı: `Konusu-Yorum`
- Kısa tanım: 2-6 yaş çocuklar için dokunma, dinleme, tekrar, hikaye, ebeveyn sesi ve günlük aktivite akışlarını bir araya getiren konuşma pratiği PWA'sı
- Referans repo: `/Users/umitaydin/Documents/Konusu-Yorum`
- Hedef ürün alanı: `/Users/umitaydin/Documents/MinaGrow/MinaPlay`

## Problem

Çocuklarda konuşma pratiği yalnız kelime listesiyle ilerlemez. Dikkat dağıtmayan, dokunmatik, tekrar edilebilir, ebeveynin sesiyle desteklenebilen ve çocuğun günlük ritmine uyum sağlayan bir deneyim gerekir.

Mevcut referans uygulama `Konusu-Yorum`, bu ihtiyacı hızlı bir PWA prototipi olarak büyük ölçüde somutlaştırmıştır. Ancak ürün artık `MinaGrow` markası altında `MinaPlay` adıyla daha temiz bir proje omurgasına, doğru meta hafızasına ve sürdürülebilir geliştirme çizgisine ihtiyaç duyar.

## İhtiyaç

İhtiyaç, yalnız yeni bir arayüz veya oyun ekranı değildir.

İhtiyaç şudur:

- `Konusu-Yorum`da çalışan çekirdeği kaybetmeden `MinaGrow / MinaPlay` kimliğine taşımak
- çocuk için sade, neşeli ve dikkat dağıtmayan bir konuşma pratiği deneyimi kurmak
- ebeveynin kelime ve cümleleri kendi sesiyle kaydedebilmesini sağlamak
- günlük aktivite, hikaye ve ilerleme takibini tek PWA yüzeyinde toplamak
- tarayıcı ve cihaz izinlerine bağlı alanlarda güvenli, anlaşılır ve geri düşebilen davranışlar üretmek
- legacy CRM/webhook parçalarını ürün çekirdeğinden ayırmak

## Amaç

`MinaPlay`in amacı, konuşmayı öğrenme sürecindeki çocuğa kısa, sevecen ve tekrar edilebilir mikro etkileşimlerle destek olmaktır.

Ürün şu ilkelere yaslanır:

- çocuk önce dokunur, duyar ve tekrar eder
- ebeveyn gerektiğinde sesiyle sürece dahil olur
- günlük küçük hedefler büyük karmaşa üretmeden görünür olur
- uygulama telefonda ve tablette rahat çalışır
- offline/PWA davranışı temel kullanım için güven verir
- ürün dili Türkçe, sade ve aile dostu kalır

## Neden Şimdi?

`Konusu-Yorum` tarafında ilk çalışan ürün hattı oluşmuştur:

- konuşma oyunu çalışır
- hikaye modülü çalışır
- kolay cümle ekleme/silme vardır
- ebeveyn ses kaydı vardır
- günlük kelime ve günlük aktivite kartı vardır
- uyku modu ve aile avatarları vardır
- build, lint, unit test ve Playwright e2e hattı kurulmuştur

Bu noktada ihtiyaç, prototipi büyütmeden önce doğru proje hafızasını kurmak ve `MinaGrow / MinaPlay` yönünü netleştirmektir.

## Çekirdek İlkeler

- mobile-first ve tablet-friendly düşünülür
- PWA yüzeyi ana ürün deneyimidir
- çocuk ekranı sade, dokunmatik ve görsel olarak sıcak kalır
- ebeveyn araçları çocuk deneyimini boğmadan destekleyici kalır
- veri şimdilik local-first ilerler
- server tarafı şimdilik ince servis ve deploy yüzeyidir
- karmaşık backend, hesap sistemi veya bulut senkronizasyonu erken açılmaz
- çalışan `Konusu-Yorum` davranışı korunarak temizlenir

## Başarı Ölçütleri

- çocuk kelime kartına dokunduğunda kelime doğru ve anlaşılır biçimde tekrar edilir
- `su` gibi özel nesneler beklenen tekrar ve animasyon davranışını korur
- ebeveyn kelime veya cümle için kendi ses kaydını ekleyebilir, oynatabilir, silebilir ve yedekleyebilir
- hikaye modülü kolay ve standart seviyeleri güvenilir biçimde ayırır
- günlük aktivite kartı günlük hedefleri karışıklık üretmeden takip eder
- PWA mobil/tablet kullanımında okunur, dokunulur ve akıcıdır
- build, lint, unit test ve e2e testleri ürün güvenini korur
- legacy CRM parçaları ürün çekirdeğiyle karıştırılmaz

## Kapsam

### Dahil

- konuşma oyunu
- kelime kartları ve tekrar davranışı
- ebeveyn tekrar ayarları
- özel ses kaydı ve kayıt kütüphanesi
- günlük kelime
- günlük aktivite kartı
- hikaye modülü
- kolay cümle editörü
- hikaye ses kaydı
- paket ilerleme ve karşılaştırma göstergeleri
- uyku modu
- aile avatarları
- maskot rehberliği
- PWA manifest ve service worker
- Railway deploy uyumu
- test ve doğrulama hattı

### Hariç

- ilk aşamada kullanıcı hesabı ve bulut senkronizasyonu
- ödeme, abonelik veya mağaza kurgusu
- klinik tanı veya tıbbi yönlendirme iddiası
- çok dilli ürünleşme
- gerçek zamanlı backend veri modeli
- karmaşık admin paneli

## Kullanıcılar / Paydaşlar

- Ümit
- çocuk kullanıcı
- ebeveyn veya bakım veren
- Codex ve geliştirme agentları
- ileride ürünü deneyen aileler

## Kısıtlar

- ürün çocuk odaklı olduğu için dikkat dağıtıcı karmaşa artırılmaz
- ses kaydı, mikrofon izni ve tarayıcı desteği açıkça düşünülür
- `localStorage` verisi cihaz bazlıdır; kalıcı hesap/senkronizasyon gibi sunulmamalıdır
- legacy CRM/webhook kodları ürün modülleriyle karıştırılmamalıdır
- referans repo ile yeni ürün alanı ayrımı görünür tutulmalıdır
- Türkçe karakter ve konuşma telaffuzu ürün kalitesi açısından önemlidir

## Başvuru Yüzeyleri

### Meta Haritası

- `project.md`: proje kimliği, problem, ihtiyaç, amaç, kapsam ve temel bağlam
- `architecture.md`: teknik omurga, bileşen sınırları ve mimari kararlar
- `data-model.md`: ana veri yapıları, storage key'ler ve ilişki mantığı
- `web.md`: PWA yüzeyi, modüller ve kullanım akışı
- `themes.md`: görsel dil, renkler, hareket ve çocuk ekranı ilkeleri
- `origins.md`: fikrin çıkışı, Konusu-Yorum evrimi ve MinaPlay yönü
- `transition.md`: Konusu-Yorum'dan MinaGrow/MinaPlay'e geçiş mantığı
- `plan.md`: aktif yürütme yönü ve yakın çalışma sırası
- `notes.md`: açık sorular, teknik riskler ve ileri adaylar
- `phases/phase-xx.md`: faz içi yürütme ve kapanış görünümü
- `worklog.md`: kapanmış iş paketleri ve kısa karar izi

### Referanslar ve Bağlantılar

- mevcut çalışan repo: `/Users/umitaydin/Documents/Konusu-Yorum`
- hedef repo kökü: `/Users/umitaydin/Documents/MinaGrow`
- hedef uygulama alanı: `/Users/umitaydin/Documents/MinaGrow/MinaPlay`
- canlı sürüm: `https://minagrow-minaplay-production.up.railway.app/`
- GitHub repo adı: `fztumit/minagrow-minaplay`
