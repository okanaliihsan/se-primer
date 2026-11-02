# Veri sözlüğü · `data/oturumlar.csv`

Her **satır bir karar**dır. Bir oyun (oturum) 3 karar içerir, yani 3 satırdır. Veriyi uygulamanın veri toplama modu (`?mod=veri`) üretir (`app/telemetry.js`).

**Toplanmayanlar (KVKK):** ad, soyad, e-posta, telefon, cihaz kimliği, IP, konum, saat (yalnız tarih). Oyuncu adı yerine oyunu yöneten kişinin verdiği bir kod (O1, O2…) kullanılır; oturum kimliği rastgele üretilir. Tutora yazılan metinler **kaydedilmez**, yalnız sayıları kaydedilir.

## Kimlik ve köken

| Sütun | Tip | Birim / değerler | Açıklama |
|---|---|---|---|
| `oturum_id` | metin | 8 hex karakter | Rastgele oturum kimliği. Gruplu çapraz doğrulamada grup anahtarı. |
| `oyuncu_kodu` | metin | `O1`, `O2`… | Oyunu yöneten kişinin verdiği kod. Kişiyi tanımlamaz. |
| `oturum_no` | tam sayı | 1, 2, 3… | Bu oyuncunun kaçıncı oyunu (aynı cihazda). **Model girdisi.** |
| `kaynak` | metin | `gercek` \| `sentetik` | Satırın kökeni. Zorunlu. |
| `surum` | metin | `app-2.0` | Veriyi üreten uygulama sürümü. |
| `tarih` | tarih | YYYY-AA-GG | Yalnız gün; saat tutulmaz. |

## Profil (girişteki 3 soru)

| Sütun | Tip | Değerler | Açıklama |
|---|---|---|---|
| `seviye` | tam sayı | 0 = yeni başladım, 1 = biraz deneyimim var, 2 = deneyimliyim | **Model girdisi.** |
| `rol` | metin | `backend`, `devops`, `qa`, `mobil` | Model girdisi değil (kategori sayısı veriye göre fazla). |
| `hedef` | metin | `mimari`, `kriz`, `kvkk` | Model girdisi değil (aynı gerekçe). |

## Karar ekranı açıldığı anda bilinenler (model girdileri)

| Sütun | Tip | Birim | Açıklama |
|---|---|---|---|
| `sahne_no` | tam sayı | 1, 2, 3 | 1 = Mimari, 2 = Test, 3 = KVKK kararı. **Model girdisi.** |
| `onceki_sahne_sure_sn` | ondalık | saniye (0,1) | Bu karardan hemen önceki ekranda geçen süre: 1. kararda giriş hikâyesi, sonrakilerde bir önceki kararın sonuç kartı. Okuma / tereddüt göstergesi. **Model girdisi.** |
| `onceki_karar_sure_sn` | ondalık | saniye (0,1) | Bir önceki karar ekranında seçime kadar geçen süre. 1. kararda 0. **Model girdisi.** |
| `onceki_riskli_sayisi` | tam sayı | 0–2 | Bu oyunda şimdiye kadar seçilen riskli seçenek sayısı. **Model girdisi.** |
| `tutor_mesaj_onceki` | tam sayı | adet | Bu karardan önce tutora yazılan mesaj sayısı (toplam). **Model girdisi.** |
| `ipucu_acma_onceki` | tam sayı | adet | Bu karardan önce "İpucu göster"e kaç kez basıldığı. Yalnız "biraz deneyimim var" seviyesinde anlamlı (yeni başlayanda ipucu hep açık, deneyimlide yok). **Model girdisi.** |
| `riskli_ustte` | 0/1 | | Riskli seçenek ekranda üstte mi gösterildi (sıra her kararda rastgele). Model girdisi **değil**; sıra etkisini denetlemek için tutulur. |

## Karardan sonra bilinenler (model girdisi DEĞİL, sızıntı olur)

| Sütun | Tip | Birim | Açıklama |
|---|---|---|---|
| `karar_sure_sn` | ondalık | saniye (0,1) | Bu karar ekranında seçime kadar geçen süre. |
| `tutor_mesaj_bu_sahne` | tam sayı | adet | Bu karar ekranında tutora yazılan mesaj sayısı. |
| `sure_doldu` | 0/1 | | "Deneyimliyim" seviyesinde 60 sn'lik süre doldu mu. |
| `model_p` | ondalık | 0–1 | Modelin bu karar için verdiği olasılık. Veri toplama modunda model kapalı olduğundan boş. |
| `model_mudahale` | 0/1 | | Tutor müdahale kartı gösterildi mi. Veri toplama modunda hep 0. |
| `riskli_secti` | 0/1 | | **Etiket.** 1 = riskli seçenek (`B`) seçildi. |

## Riskli seçenek ne demek?

Her kararda sonuçları daha kötü olan yol (spec.md §7): K1 "üreticinin otomatik düzeltmesini bekle", K2 "script'i 600 makineye aynı anda uygula", K3 "fotoğrafı olduğu gibi gruba at". Bu tanım içerikten gelir, oyuncunun cevabına göre değişmez.

## Bilinen sınırlar

- Aynı kişi aynı hikâyeyi birden çok kez oynadığında öğrenir; `oturum_no` bu etkiyi taşır. Bu, modelin "deneyim" sinyalinin bir kısmının gerçekte "hikâyeyi ezberleme" olduğu anlamına gelir.
- Süreler telefonun saatine göre ölçülür; uygulama arka plana atılırsa şişebilir.
