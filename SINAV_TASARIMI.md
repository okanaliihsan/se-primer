# Sınav tasarımı · "Sizinle uyumlanan" bir vize sorusu

**Fikir:** Primer oyuncunun önceki seçimine göre bir sonraki sahneyi değiştiriyordu. Kâğıt bir sınav da bunu yapabilir: soru **dallanır**. Öğrenci (a)'da hangi kavramı seçtiyse (b) o kavramın **sınırını** sorar. Ezberleyen öğrenci (a)'yı tutturabilir ama (b)'de takılır; kavramın özünü anlayan iki dalda da yazabilir. Puan "doğru şık"a değil, **gerekçeye** verilir.

---

**Soru (25 puan, tek sayfa, kapalı kitap).**

Bir ekip, hastane randevu sisteminin "iptal riski" modelini Python'da eğitip `model.onnx` olarak dışa aktarıyor. Aynı dosya hem mobil uygulamada hem sunucuda çalışıyor. Ekip 5 sabit girdi seçiyor, Python'un verdiği olasılıkları bir dosyaya kaydediyor ve her sürümde uygulamanın aynı girdilere verdiği cevapla karşılaştırıyor. Bir gün şu rapor geliyor:

| Girdi | Python | Mobil | Sunucu |
|---|---|---|---|
| 1 | 0,677100 | 0,677100 | 0,677100 |
| 2 | 0,912345 | 0,912351 | 0,912345 |
| 3 | 0,000000 | 0,000000 | **NaN** |

**(a)** Bu düzeneği en iyi açıklayan iki kavramı adlandırın ve her birinin bu düzenekte **neye** karşılık geldiğini gösterin. *(8 puan)*

**(b) Dallanma: (a)'da hangi kavramla başladıysanız o dalı cevaplayın.** *(12 puan)*
- **Diferansiyel test** ile başladıysanız: 2. satırdaki 6·10⁻⁶ fark bir hata mı? Kararınızı hangi bilgiye dayandırırsınız? Toleransı **siz** belirleseydiniz neye bakarak belirlerdiniz?
- **Test kahini (oracle)** ile başladıysanız: Python'un kendisi yanlışsa bu düzenek bunu yakalar mı? Yakalamıyorsa, kahinin doğruluğunu ne güvenceye alır?
- **Regresyon testi** ile başladıysanız: 3. satırdaki NaN dün yoktu. Bu bir regresyon mu, yoksa testin hiç sınamadığı bir durumun ilk kez görünmesi mi? İkisini nasıl ayırırsınız?

**(c)** Ekip "5 girdinin hepsi tuttu, model doğru" diyor. Bu cümlede **doğrulama (verification)** ile **geçerleme (validation)** nerede karışıyor? Tek cümleyle düzeltin. *(5 puan)*

---

**Beklenen temel kavramlar:** diferansiyel test (aynı girdiye iki uygulamanın cevabını karşılaştırmak), test kahini (Python referansı), hata toleransı (float32 hassasiyeti ≈ 10⁻⁷, iş açısından anlamlı fark), regresyon (dün geçen bugün kırıldı), karakterizasyon testi (mevcut davranışı "doğru" saymadan kayda geçirmek).

**Çeldiriciler ve neden çeldirici oldukları:**
- *"Birim testi":* Tek bir fonksiyonu değil, iki sistemin cevabını karşılaştırıyoruz.
- *"A/B testi":* Kullanıcıya iki sürüm göstermiyoruz; aynı girdiyi iki motora veriyoruz.
- *"Model doğru çalışıyor":* Parite yalnız **aynı modelin aynı cevabı verdiğini** doğrular (verification). Modelin **gerçek iptal riskini doğru tahmin ettiğini** (validation) söylemez; bunun ölçüsü eğitimdeki eval metriğidir.

**Neden bu tasarım:** Kavramı tanımlamak yetmiyor; (b) her kavramın kırıldığı yeri soruyor. Bu ödevde parite testini yazarken benim takıldığım yer de buydu: 1e-4'ün nereden geldiğini, Python'un neden "doğru" sayıldığını kendime açıklamam gerekti. Notlama: (a) adlandırma 2 + eşleme 2 (×2); (b) karar 4, gerekçe 4, öneri 4; (c) ayrımı görmek 3, düzeltme 2.
