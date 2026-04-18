# MinaPlay Progress

Bu dosya, temiz MinaPlay uygulama alanındaki kısa ilerleme izini tutar.

## 2026-04-18 - Temiz Taşıma Başlangıcı

- `Konusu-Yorum` referans reposundan PWA çekirdeği MinaPlay klasörüne taşındı.
- CRM, Zoho, webhook, lowdb, segmentation ve Meta webhook doğrulama parçaları dışarıda bırakıldı.
- Üretilebilir çıktılar (`dist`, `public/js`, `output`, `test-results`) taşınmadı.
- Pofi PNG emoji assetleri korundu.
- Server sade static PWA + `/health` yüzeyine çekildi.
- Manifest, README ve service worker MinaPlay yönüne göre sadeleştirildi.

## Sonraki Adaylar

- Görünen ürün metinlerinde Türkçe karakter ve MinaPlay/Pofi dili temizliği.
- Parent panel analiz ekranının gerçek ürün yüzeyine eklenmesi.
- Dokun, Eşleme, Cümle, Hikaye, Ayna, Uyku, Ceee bilgi mimarisine göre yeni modül paketleri.
- Pofi davranış/state/render sisteminin modüller arası merkezi hale getirilmesi.
