# Teslim rehberi · senin yapman gerekenler (~45 dk)

Bu adımlar senin hesabınla yapılması gereken işler. Sırayla git; her adımın sonunda ne elde edeceğin yazıyor.

## 1. GitHub repo (5 dk)

1. github.com → **New repository** → ad: `se-primer` → Public → Create.
2. Bu klasördeki her şeyi yükle: "uploading an existing file" bağlantısı ile `se-primer.zip`'i açıp içindekileri sürükle bırak, ya da terminalde:
   ```bash
   cd se-primer && git init && git add . && git commit -m "SE Primer bölüm 1" \
     && git branch -M main && git remote add origin https://github.com/KULLANICI/se-primer.git && git push -u origin main
   ```
3. (Ad, numara ve e-posta README ve spec dosyalarına yazıldı; bir şey yapmana gerek yok.)
4. İsteğe bağlı yedek link: Settings → Pages → Branch `main`, klasör `/ (root)` → `https://KULLANICI.github.io/se-primer/dist/`.

→ **Elde edilen:** GitHub repo linki.

## 2. Google Stitch (10 dk)

1. stitch.withgoogle.com → Google hesabınla gir → **Mobile**.
2. `design/stitch-prompt.md` içindeki İngilizce metni yapıştır → üret.
3. 3 ekranın ekran görüntüsünü al, `design/stitch/` klasörüne koy (repoda bu klasörü oluştur).
4. Stitch'te **Export** menüsünde AI Studio seçeneği varsa onu kullan (bir sonraki adım).

→ **Elde edilen:** Stitch ekranları (puanlamada "Stitch ekranları" isteniyor).

## 3. Google AI Studio (10–15 dk)

1. aistudio.google.com → **Build** (Stitch'ten export ettiysen zaten burada açılır).
2. Şu talimatı ver ve `spec.md`, `DESIGN.md`, `app/story.js`, `app/tutor.js` dosyalarını ekle:
   > Bu spec ve DESIGN.md'ye göre mobil öncelikli bir uygulama kur. Anlatı içeriğini ve son belirleme kuralını story.js'den, tutor davranışını ve sızıntı kalkanını tutor.js'den birebir al. Tutor'un Gemini çağrısında TUTOR_SYSTEM_PROMPT'u kullan ve her Gemini yanıtını leakCheck'ten geçir; kalkan takılırsa localReply sonucunu göster. Her etkileşimli öğeye spec'teki data-cy değerlerini ver.
3. Çıkan uygulamayı telefonda QR ile aç, 3 kararı oyna, bir son gör.
4. AI Studio arayüzü değişebilir; tıkanırsan yedek olarak `dist/index.html` dosyasını AI Studio'ya yükleyip "Bunu çalıştır" diyebilirsin.
5. **Share / Deploy** ile linki al.

→ **Elde edilen:** AI Studio uygulama linki.

## 4. Cypress (10 dk, Node.js kurulu bilgisayarda)

```bash
npm install
npm run serve        # bir terminalde açık kalsın
npm run cy:run       # ikinci terminalde
```
- 17 testin hepsi yeşil olmalı. `cypress/videos/demo.cy.js.mp4` dosyasını `demo/` altına koy, repoya ekle.
- Videoyu YouTube (liste dışı) veya Drive'a yükle, linki README'ye yaz.

→ **Elde edilen:** gerçek Cypress koşusundan demo video linki.

## 5. Kullanıcı testi (15 dk)

`docs/kullanici-testi.md` dosyasını aç, adımları izle, doldur. Gerçek bir kişi olmalı.

## 6. Classroom

- Teslim: **GitHub repo linki + AI Studio linki + demo video linki**.
- Hocanın geçen haftaki formunu da doldurmayı unutma (ad, soyad, öğrenci durumu, gönderi linki).
