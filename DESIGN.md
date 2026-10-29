# DESIGN.md — SE Primer

> Bu dosya hem insanlar hem ajanlar için tasarım bağlamıdır (Stitch, AI Studio veya başka bir kodlama ajanına verilir).

## Fikir

Gece nöbetinde elinde fenerle okunan bir kitap. Zemin lacivert gece, vurgu fener turuncusu. Krizin geldiği her an, Windows durma ekranının mavisiyle işaretlenir. Hikâye metni kitap gibi serif, saatler ve etiketler terminal gibi mono.

## Renk tokenları

| Token | Koyu (varsayılan) | Açık | Kullanım |
|---|---|---|---|
| `--bg` | `#0f1830` | `#f3f5fa` | Sayfa zemini (ders afişinin laciverti) |
| `--surface` | `#17233f` | `#ffffff` | Seçenek kartları, tutor başlığı |
| `--raise` | `#1e2d50` | `#e8ecf5` | İpucu, tutor balonu, seçili çip |
| `--fg` | `#eef0f6` | `#121e3b` | Ana metin |
| `--muted` | `#a6b0c8` | `#55607a` | İkincil metin, "Senin gözünden" |
| `--line` | `#2c3b60` | `#d3d9e6` | Kenarlıklar |
| `--accent` | `#f2a65a` | `#c76a12` | Fener turuncusu: birincil düğme, etiketler, ilerleme |
| `--bsod` | `#0a62c9` | `#0a5ab8` | Kriz ve "Gerçekte ne oldu?" kutuları |
| `--good` / `--bad` / `--late` | `#6fd3a4` / `#ff8a7a` / `#f2d06b` | `#1c7d55` / `#b8382a` / `#8a6a00` | SON A / SON B / SON C |
| `--paper` | `#f4efe2` | `#fbf7ec` | Sahnedeki kâğıt belgeler (ameliyat listesi) |

## Tipografi

| Rol | Yazı tipi | Yedek | Nerede |
|---|---|---|---|
| Başlık | Bricolage Grotesque 600/800 | Avenir Next, Segoe UI | Bölüm adı, soru, son başlığı |
| Okuma | Source Serif 4 400/600 | Georgia | Hikâye metni, seçenekler |
| Mono | JetBrains Mono 500/700 | SF Mono, Menlo | Saat (07:09), etiketler (KARAR 1 · MİMARİ), sayaç |

Ölçek: 2rem / 1.35rem / 1.05rem / 0.95rem / 0.75rem. Okuma metni 17px, satır yüksekliği 1.55.

## Yerleşim

- Tek sütun, en fazla 480px, yan boşluk ≥ 16px (güvenli alan dahil).
- Her ekranın tepesinde 3 parçalı ilerleme çubuğu (karar sayısı).
- Seçenekler tam genişlikte, harf (A/B) solda mono turuncu.
- Dokunma hedefleri ≥ 44px.

## Ekranlar (en az 3)

1. **Giriş / Profil** — kapak (bölüm adı, "Nöbetçi sensin.", gerçek olay satırı) + 3 soru grubu (seviye, rol, hedef) + "Bölümü başlat". → `design/1-giris-*.png`
2. **Sahne / Karar** — ilerleme, etiket + saat (+ deneyimliyse 60 sn sayaç), durum metni, varsa kâğıt belge, "Senin gözünden" satırı, soru, A/B seçenekleri, ipucu (seviyeye göre), tutor paneli. → `design/2-sahne-*.png`
   - **2b. Sonuç kartı** — Ne oldu? / Neden oldu? / Gerçekte ne oldu? + kavram kartı. → `design/2b-sonuc-*.png`
3. **Son** — SON A/B/C rozeti (renk tonuyla), başlık, karar izi, "Bugün öğrendiğim" (hedefin kavramı turuncu kenarlı ve en üstte). → `design/3-son-*.png`

## Bileşen kuralları

- **Tutor balonları:** tutor solda `--raise`, oyuncu sağda `--accent`. Başlıkta "Cevabı söylemez, soru sorar" sözü her zaman görünür.
- **Gerçek/kurgu ayrımı:** Gerçek olaya ait her bilgi `--bsod` sol çizgili kutuda. Kurgusal veri içeren belgeler "Sahte veri" etiketi taşır.
- **Durumlar:** Sayaç ≤ 10 sn'de `--bad`. Süresi dolan karar son ekranda "süre baskısı" rozetiyle görünür.
- **Hareket:** Ekran geçişinde 0,28 sn hafif yükselme; `prefers-reduced-motion` açıksa yok.
- **Test kancaları:** Her etkileşimli öğede `data-cy` vardır (bkz. `cypress/`).

## Stitch

Ekranlar önce Google Stitch'te üretildi (`design/stitch/`). Stitch'ten görsel dili aldım; uydurduğu teknik ayrıntıları ve cevabı ele veren "risk" etiketlerini almadım. Gerekçeler: [`design/stitch/README.md`](design/stitch/README.md).

## Durum makinesi

`design/durum-makinesi.png` (kaynak: `design/durum-makinesi.mmd`, spec.md §6 ile aynı).
