---
name: minaplay-assets
description: MinaPlay runtime asset klasorlerinin rol ayrimini tanimlar.
created: 2026-04-27
updated: 2026-05-08
---

# Assets

Bu klasor yalniz uygulamada dogrudan servis edilecek final assetleri tasir.

## Klasorler

- `brand/`: MinaGrow ve MinaPlay logo, ikon ve marka PNG dosyalari.
- `icons/`: uygulama ve modul ikonlari. Runtime ikonlarda PNG kullanilir.
- `modules/`: moduller icin optimize runtime PNG dosyalari.
- `pofi/poses/`: ekranda dogrudan kullanilan butun Pofi PNG pozlari.
- `pofi/parts/body/`: Pofi govde katmanlari.
- `pofi/parts/eyes/`: Pofi goz katmanlari.
- `pofi/parts/mouth/`: Pofi agiz ve konusma katmanlari.
- `pofi/parts/hands/`: Pofi el, isaret, dokunma ve yonlendirme katmanlari.
- `pofi/parts/eyebrows/`: Pofi kas katmanlari.
- `pofi/parts/effects/`: kizarma, vurgu ve benzeri destek katmanlari.

## Isimlendirme

- Runtime yolunda `pofi_emoji` kullanilmaz; Pofi artik davranissal bir karakter sistemidir.
- Tam pozlar sade isim alir: `happy.png`, `playful.png`, `sleeping.png`, `tongue.png`.
- Parca assetleri kategori klasoru icinde okunur: `eyes/open-v01.png`, `mouth/smile-v01.png`.
- Surumlu varyasyonlarda `-v01`, `-v02` son eki korunur.
- Modul gorselleri Ingilizce rota adlariyla tutulur: `touch.png`, `matching.png`, `mirror.png`, `sleep.png`.
- Marka gorselleri urun adi ve rol ile tutulur: `minaplay-logo.png`, `minaplay-icon.png`.
- PSD ve benzeri kaynak dosyalar `public/assets/` altinda tutulmaz; `MinaPlay/assets-source/` altinda bulunur.
- Buyuk PNG kaynaklari `MinaPlay/assets-source/` altinda saklanir; public ikonlar ve modul gorselleri optimize runtime kopyalardir.
- ChatGPT uretim referanslari ve deneme ciktisi burada tutulmaz; repo disi calisma alani olarak ayrica saklanir.
- PSD ve benzeri kaynak dosyalar public altinda servis edilmez; `MinaPlay/assets-source/` altinda tutulur.
