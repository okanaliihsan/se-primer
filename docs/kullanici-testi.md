# Kullanıcı testi · SE Primer Bölüm 1

> Bu test **gerçek bir kişiyle** yapıldı. Aşağıdaki gözlemler katılımcının kendi anlattıklarından alındı; boş bırakılan alanlar "belirtilmedi" diye işaretlendi, tahminle doldurulmadı.
> Yöntem: Katılımcıya link verildi, açıklama yapılmadı; oynadıktan sonra ne yaptığını ve ne gördüğünü anlattı.

## Katılımcı

| Alan | Değer |
|---|---|
| Kim | A. Ş. (arkadaş) |
| Tarih / süre | 29.10.2026 / 7–8 dakika |
| Cihaz | Kendi telefonu, iPhone 15 Pro Max (tarayıcı belirtilmedi) |
| Seçtiği profil | Seviye: Yeni başladım · Rol: Backend · Hedef: Kriz yönetimi |
| Kararları ve vardığı son | K1 A · K2 A (önce 1 makinede dene) · K3 A (maskele) → SON A *(son belirleme kuralına göre A-A-A)* |

## Gözlem (oynarken)

| Ekran | Ne oldu / ne dedi |
|---|---|
| Karar 1 | A'yı seçti, karar sorunsuz bitti. |
| Karar 2 | Script'i önce 1 makineye uyguladı; "doğru karar verdim galiba" dedi, yani seçiminden emin değildi. |
| Karar 3 · Tutor | Tutora "tc kimlik numarası yetmez mi" diye yazdı (soru işareti olmadan). Tutor cevap vermeyip soru sordu. "Cevap vermeyecek misin" diye sorunca tutor cevap vermeyeceğini söyledi. |
| Karar 3 · Tutor | "Soru sordukça yazılar küçüldü" dedi. |
| Karar 3 | Fotoğrafı olduğu gibi göndermedi, maskeli paylaşımı seçti. |
| Her karar sonrası | Sonuç kartlarını ve "Gerçekte ne oldu?" bölümünü fark etti: "her karar sonrasında sonuçlarımı ve gerçekte ne olduğu yazıyor". |

**İlk takıldığı yer:** Karar 3'te, T.C. kimlik numarasının tek başına yeterli olup olmadığı. Bunu tutora soru işareti koymadan sordu.

## Sorular (bittikten sonra)

1. Bu bölümden aklında kalan bir şey var mı? Ne? → "Slack" (Karar 1 sahnesinde geçen, üreticinin notunun düştüğü kanal)
2. Tutor sana cevabı söyledi mi? Sorular işine yaradı mı? → Söylemedi, ısrar edince de söylemeyeceğini belirtti. İşine yarayıp yaramadığı belirtilmedi.
3. Hangi karar en zordu, neden? → Karar 2: önce 1 makinede denemek ile 600 makineye aynı anda uygulamak arasında kaldı.
4. "Gerçekte ne oldu?" kutularını okudun mu? → Evet, her karardan sonra fark etti.
5. Neyi değiştirirdin? → Belirtilmedi

## Bulgular

**Olumlu:**
- Tutor "cevabı söyle" baskısına dayandı (B2, KA-5 gerçek kullanıcıda da tuttu).
- Sonuç kartları ve "Gerçekte ne oldu?" bölümü fark edildi.
- Katılımcı iyi sona (SON A) ulaştı; yeni başlayan profiliyle baştan sona oynanabildi (B1).

**Olumsuz:**
- B4 tutmadı: akılda kalan kavram değil sahnedeki bir marka adı (Slack) oldu. "Bugün öğrendiğim" kartları son ekranda, oyuncu oraya gelince okumayı bırakmış olabilir.
- Telefonda soru "?" olmadan yazıldı. Yerel tutor motoru işaretsiz soruyu gerekçe sanıyor ve "Gerekçeni görüyorum" diye başlıyordu; bu, T.C. no'yu yeterli sanan oyuncuyu onaylıyormuş gibi okunabilir. → KA-6 ile düzeltildi (`app/tutor.js`, v3).
- "Yazılar küçüldü" gözlemi: `dist/index.html` üzerinde 390 px genişlikte 11 mesajlık yazışmada mesaj yazı boyutu sabit kaldı (15,2 px), yani yerel sürümde tekrar üretilemedi. Olası neden: iOS Safari, yazı boyutu 16 px'in altındaki bir giriş kutusuna dokunulunca sayfayı yakınlaştırır; tutor giriş kutusu 15,2 px. Klavye kapanıp yakınlaştırma değişince yazılar küçülmüş gibi görünebilir. iPhone'da doğrulanmadı; **açık konu**.

**Başarı ölçütü B4 (en az 1 kavramı öğrendiğini fark etti mi?):** Hayır. Aklında kalan "Slack" oldu; bu, sahnedeki bir ayrıntı, bölümün öğrettiği kavramlardan (ortak hata noktası, canary / kademeli dağıtım, veri minimizasyonu) biri değil. Karar 2'de doğru yolu seçmesine rağmen "canary" kavramını adıyla hatırlamadı. Tek katılımcıyla B4 hedefi karşılanmadı.

## Sonuç: yeni kabul örneği

**KA-6 · Soru işaretsiz soru da soru sayılır** (`spec.md §8`, `cypress/e2e/kabul.cy.js`)
- *Verilen:* Karar 3 ekranı, tutor açık
- *Ne zaman:* Oyuncu "tc kimlik numarası yetmez mi" yazar (soru işareti yok)
- *O zaman:* Tutor yanıtı oyuncunun sorusunu soru olarak ele alır: "Gerekçeni görüyorum" ile başlamaz, soru işareti içerir, seçenek metnini önermez.
