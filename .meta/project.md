---
name: project
description: MinaPlay projesinin problemi, amacı, kapsamı, başarı ölçütleri ve temel bağlamını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Proje

## Özet

- Proje adı: `MinaPlay`
- Üst bağlam: `MinaGrow`
- Referans adı: `Konusu-Yorum`
- Kısa tanım: 0-5 yaş çocuklar için konuşma, taklit, duygu ve etkileşim desteğini sakin, görsel olarak yumuşak ve premium hissiyatlı bir PWA yüzeyinde birleştiren gelişim destek uygulaması
- Uzun vadeli vizyon: MinaPlay ilerleyen seviyelerde 0-18 yaş aralığında okul öncesi, örgün öğretim ve engelli bireylerin okul süreci desteğine genişleyebilen bir eğitim ve gelişim destek platformuna dönüşebilir
- Ana karakter ve davranış sistemi: `Pofi`
- Dil: Türkçe
- Hedef cihaz: tablet ve telefon
- Referans repo: `/Users/umitaydin/Documents/Konusu-Yorum`
- Hedef ürün alanı: `/Users/umitaydin/Documents/MinaGrow/MinaPlay`

## Problem

Konuşma ve gelişim desteği alan çocuklar için dijital deneyim yalnız kelime listesi veya oyun ekranı değildir. Çocuğun sakin kalabildiği, tekrar yapabildiği, taklit edebildiği, duygu tepkilerini güvenli biçimde gördüğü ve ebeveynin süreci ayrı bir katmandan destekleyebildiği kontrollü bir sistem gerekir.

Mevcut referans uygulama `Konusu-Yorum`, bu ihtiyacı hızlı bir PWA prototipi olarak somutlaştırmıştır. Ancak ürün artık `MinaPlay` adıyla daha net bir kimliğe, Pofi merkezli davranış sistemine, sade çocuk yüzeyine ve ileride eğitim/terapi destek ağına büyüyebilecek sürdürülebilir bir proje hafızasına ihtiyaç duyar.

## İhtiyaç

İhtiyaç, yalnız yeni bir arayüz veya oyun ekranı değildir.

İhtiyaç şudur:

- `Konusu-Yorum`da çalışan çekirdeği kaybetmeden `MinaPlay` kimliğine taşımak
- 0-5 yaş başlangıç odağında konuşma, taklit, duygu ve etkileşim pratiklerini desteklemek
- çocuğun yüzeyini sade, sakin, düşük uyarımlı ve dokunmatik tutmak
- ebeveyn ayarlarını çocuk yüzeyinden ayrı bir katmanda yönetmek
- Pofi'yi süs karakteri değil, yönlendiren, tepki veren, egzersiz gösteren ve sakinleştiren davranışsal etkileşim sistemi olarak kurmak
- okul öncesi ve ileride örgün öğretim desteğine genişleyebilecek bir ürün yönü bırakmak
- gönüllü eğitimciler, ebeveynler, terapistler ve okul sürecindeki destek aktörleri arasında ileride kontrollü bir ağ kurulabilecek zemini korumak
- legacy CRM/webhook ve eski karakter/asset parçalarını ürün çekirdeğinden ayırmak

## Amaç

`MinaPlay`in amacı, konuşma ve gelişim desteği alan çocuğa kısa, sakin, tekrar edilebilir ve güven veren mikro etkileşimlerle destek olmaktır.

Ürün şu ilkelere yaslanır:

- çocuk dokunur, dinler, taklit eder ve tekrar eder
- yanlış cevap veya hedef dışı dokunuş cezalandırıcı olmaz
- Pofi yumuşak biçimde yönlendirir, tepki verir ve bağlama göre görsel ifade değiştirir
- ebeveyn gerektiğinde ayrı katmandan içerik, ses, sınır ve destek ayarlarını yönetir
- uygulama telefonda ve tablette rahat çalışır
- offline/PWA davranışı temel kullanım için güven verir
- ürün dili Türkçe, sade, aile dostu ve düşük baskılı kalır

## Uzun Vadeli Vizyon

MinaPlay bugünkü çekirdekte 0-5 yaş konuşma, taklit, duygu ve etkileşim desteğine odaklanır.

İlerleyen seviyelerde ürün şu yöne büyüyebilir:

- 0-18 yaş aralığında gelişim ve eğitim desteği
- okul öncesi hazırlık ve örgün öğretim süreci desteği
- engelli bireylerin okul sürecinde günlük, haftalık ve dönemsel desteklenmesi
- ebeveyn, gönüllü eğitimci, terapist ve okul destek aktörleri arasında kontrollü bir ağ
- kişiselleştirilmiş planlar, kısa ev egzersizleri, tekrar takibi ve raporlama

Bu vizyon bugünkü PWA çekirdeğine erken yüklenmez; ürün hafızasında gelecek yön olarak tutulur.

## Çekirdek İlkeler

- mobile-first ve tablet-friendly düşünülür
- PWA yüzeyi ana ürün deneyimidir
- çocuk ekranı sade, dokunmatik, sakin ve düşük uyarımlı kalır
- ebeveyn araçları ayrı katmanda destekleyici kalır
- Pofi davranış sistemi her modda tek aktif state ile çalışır
- veri şimdilik local-first ilerler
- server tarafı şimdilik ince servis ve deploy yüzeyidir
- karmaşık hesap, bulut senkronizasyonu, terapist paneli veya okul ağı erken açılmaz
- çalışan `Konusu-Yorum` davranışı korunarak temizlenir

## Başarı Ölçütleri

- çocuk ana mod kartlarını tablette ve telefonda kolayca ayırt eder
- çocuk nesneye dokunduğunda kelime veya ses doğru ve anlaşılır biçimde duyulur
- hedef dışı dokunuş çocuğa başarısızlık hissi vermez; Pofi yumuşak yönlendirmeye devam eder
- Eşleme, Cümle, Hikaye, Ayna, Uyku ve Ceee akışları çekirdek navigasyonda doğru ayrışır
- Ayna modunda egzersiz yüzü egzersiz sırasında, ödül yüzü egzersiz tamamlandıktan sonra görünür
- Uyku modunda yalnız sleepy/sleep Pofi durumları kullanılır ve rastgele duygu/guide state çalışmaz
- ebeveyn ayarları çocuk yüzeyini boğmadan ayrı katmanda yönetilir
- PWA mobil/tablet kullanımında okunur, dokunulur ve akıcıdır
- build, lint, unit test ve e2e testleri ürün güvenini korur
- legacy CRM ve eski karakter/asset parçaları ürün çekirdeğiyle karıştırılmaz

## Kapsam

### Dahil

- Dokun modu
- Eşleme modu
- Cümle modu
- Hikaye modu
- Ayna modu
- Uyku modu
- Ceee bonus modu
- Parent panel
- Pofi davranış/state/render sistemi
- özel ses kaydı ve kayıt kütüphanesi
- hikaye ve kolay cümle yönetimi
- ilerleme ve tekrar takibi
- PWA manifest ve service worker
- Railway deploy uyumu
- test ve doğrulama hattı

### Hariç

- ilk aşamada kullanıcı hesabı ve bulut senkronizasyonu
- ödeme, abonelik veya mağaza kurgusu
- klinik tanı veya tıbbi yönlendirme iddiası
- terapist dashboard'u
- gönüllü eğitimci ağı
- okul/kurum yönetim paneli
- gerçek zamanlı backend veri modeli
- çok dilli içerik sistemi

## Kullanıcılar / Paydaşlar

- Ümit
- çocuk kullanıcı
- ebeveyn veya bakım veren
- Codex ve geliştirme agentları
- ileride gönüllü eğitimciler
- ileride terapistler ve okul süreci destek aktörleri
- ileride ürünü deneyen aileler

## Kısıtlar

- ürün çocuk ve engelli birey desteği bağlamında dikkat dağıtıcı karmaşa artırmaz
- eğitim ve terapi destek dili tıbbi tanı iddiası gibi yazılmaz
- ses kaydı, mikrofon izni, kamera izni ve tarayıcı desteği açıkça düşünülür
- `localStorage` verisi cihaz bazlıdır; kalıcı hesap/senkronizasyon gibi sunulmaz
- legacy CRM/webhook kodları ürün modülleriyle karıştırılmaz
- referans repo ile yeni ürün alanı ayrımı görünür tutulur
- Türkçe karakter ve konuşma telaffuzu ürün kalitesi açısından önemlidir

## Başvuru Yüzeyleri

### Meta Haritası

- `project.md`: proje kimliği, problem, ihtiyaç, amaç, kapsam ve temel bağlam
- `architecture.md`: teknik omurga, bileşen sınırları ve mimari kararlar
- `data-model.md`: ana veri yapıları, storage key'ler ve ilişki mantığı
- `web.md`: PWA yüzeyi, modüller ve kullanım akışı
- `themes.md`: görsel dil, renkler, hareket ve çocuk ekranı ilkeleri
- `origins.md`: fikrin çıkışı, Konusu-Yorum evrimi ve MinaPlay yönü
- `transition.md`: Konusu-Yorum'dan MinaPlay'e geçiş mantığı
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
