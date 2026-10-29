/* SE Primer · Bölüm 1 — anlatı verisi (ADR-1: içerik koddan ayrı).
   Gerçek olay: 19 Temmuz 2024 CrowdStrike kesintisi. Hastane ve kişiler kurgusaldır. */
(function (root) {
  const STORY = {
    id: 'bolum-1',
    title: '07:09, ekranlar maviye döndü',
    subtitle: 'Nöbetçi sensin.',
    realEvent: '19 Temmuz 2024 · CrowdStrike Falcon güncellemesi',

    profile: {
      level: {
        label: 'Seviyen',
        options: [
          { id: 'yeni', label: 'Yeni başladım', note: 'Her kararda ipucu açık gelir' },
          { id: 'orta', label: 'Biraz deneyimim var', note: 'İpucu istersen bir dokunuş uzakta' },
          { id: 'deneyimli', label: 'Deneyimliyim', note: 'İpucu yok, her karar 60 saniye' }
        ]
      },
      role: {
        label: 'Kendini hangi rolde görüyorsun?',
        options: [
          { id: 'backend', label: 'Backend' },
          { id: 'devops', label: 'DevOps / Nöbetçi' },
          { id: 'qa', label: 'Test / QA' },
          { id: 'mobil', label: 'Mobil' }
        ]
      },
      goal: {
        label: 'Bu bölümden ne öğrenmek istiyorsun?',
        options: [
          { id: 'mimari', label: 'Mimariyi anlamak' },
          { id: 'kriz', label: 'Kriz yönetimi' },
          { id: 'kvkk', label: 'Güvenlik ve KVKK' }
        ]
      }
    },

    intro: {
      clock: '07:09',
      text: [
        'Cuma sabahı. Şehir hastanesinde nöbetçi BT mühendisi sensin.',
        'Telefonun titriyor: acil servisteki triyaj ekranı mavi. Sonra laboratuvar. Sonra poliklinik. Yeniden başlatılan makineler birkaç saniye sonra yine çöküyor.',
        'Hastanedeki 600 Windows makinenin çoğu aynı durumda. 08:30\'da 14 ameliyat planlı. Ekipte sen ve iki kişi daha var.'
      ],
      fact: 'Gerçekte: 19 Temmuz 2024\'te 04:09 UTC\'de (Türkiye saatiyle 07:09) CrowdStrike Falcon sensörüne giden bir içerik güncellemesi, dünya genelinde yaklaşık 8,5 milyon Windows makineyi mavi ekrana düşürdü.'
    },

    decisions: [
      {
        id: 'k1',
        tag: 'Karar 1 · Mimari',
        clock: '07:24',
        topic: 'mimari',
        situation: 'Güvenlik ekibinin Slack kanalına üreticiden ilk not düştü: sorun bir içerik güncellemesinden kaynaklanıyor, düzeltme üzerinde çalışılıyor. Başhekim yardımcısı arıyor: "Ne zaman açılır?"',
        question: 'İlk saatini neye harcayacaksın?',
        options: {
          A: { label: 'Kritik birimleri belirle, önce onları elle kurtar', short: 'Önce kritik birimler, elle' },
          B: { label: 'Üreticinin otomatik düzeltmesini bekle', short: 'Otomatik düzeltmeyi bekle' }
        },
        roleLens: {
          backend: 'Senin gözünden: Hasta kayıt servisi ayakta ama ona bağlanan istemciler yok. Sunucu çalışıyor diye sistem çalışıyor mu?',
          devops: 'Senin gözünden: Filodaki her makinede aynı ajan var. Ortak bağımlılık, ortak hata noktası demek mi?',
          qa: 'Senin gözünden: Bu güncelleme müşteriye çıkmadan önce hangi testten geçmiş olmalıydı?',
          mobil: 'Senin gözünden: Hastanenin mobil randevu uygulaması açık ama arka uçtaki personel ekranları kapalı. Kullanıcı ne görüyor?'
        },
        hint: 'Bir makine açılır açılmaz çöküyorsa, internetten düzeltme indirecek kadar açık kalabilir mi?',
        socratic: [
          'Çöken bir makine, üreticinin gönderdiği düzeltmeyi hangi anda indirebilir?',
          'Hastanede hangi ekranın bir saat kapalı kalması bir hastaya zarar verir, hangisininki vermez?',
          'Üç kişilik bir ekiple 600 makineye ulaşamıyorsan, sırayı neye göre belirlersin?',
          'Bu kadar makinenin aynı anda düşmesi, mimaride neyin ortak olduğunu gösteriyor?'
        ],
        outcomes: {
          A: {
            title: 'Acil 08:40\'ta açıldı',
            what: 'Acil, ameliyathane ve laboratuvardaki 46 makineyi listeledin. Her birini kurtarma moduna alıp hatalı dosyayı elle sildiniz. Acil servis 08:40\'ta yeniden hasta kabul ediyor.',
            why: 'Çöken makine düzeltmeyi indirecek kadar açık kalamıyor; bu yüzden kurtarma elle yapılmak zorundaydı. Kısıtlı ekiple önce hasta güvenliğine dokunan ekranları seçmek, toplam zararı azalttı.',
            real: 'Gerçekte üretici hatalı içeriği 05:27 UTC\'de geri çekti, ama zaten çökmüş makinelerin çoğu kendiliğinden düzelmedi. Güvenli mod veya kurtarma ortamında dosyanın elle silinmesi gerekti.'
          },
          B: {
            title: '1,5 saat kaybedildi',
            what: 'Üretici içeriği geri çekti ama makineler hâlâ açılıp çöküyor. 08:55\'te elle kurtarmaya başladığınızda ameliyat saati çoktan geçmişti.',
            why: 'Düzeltme ağdan geliyordu; çöken makine ağa bağlanacak kadar ayakta kalamıyordu. Beklemek, sorunun kendini çözeceğini varsaydı.',
            real: 'Gerçekte bazı makineler birkaç kez yeniden başlatılınca düzeltmeyi alabildi, ama çoğu kuruluş elle müdahale etmek zorunda kaldı.'
          }
        },
        lesson: {
          term: 'Ortak hata noktası',
          text: 'Çekirdek seviyesinde çalışan tek bir ajan, tüm filoyu aynı anda düşürebilir. Mimari karar sadece kodda değil, neyin her yerde aynı olduğunda da verilir.'
        }
      },
      {
        id: 'k2',
        tag: 'Karar 2 · Test',
        clock: '09:05',
        topic: 'test',
        situation: 'Ekipten Emre heyecanla geliyor: "Forumda bir script buldum. Ağ üzerinden bütün makinelerde C-00000291*.sys dosyasını siliyor. 600 makineyi bir dakikada hallederiz."',
        question: 'Script\'i nasıl kullanacaksın?',
        options: {
          A: { label: 'Önce 1 makinede dene, sonra genişlet', short: 'Önce 1 makinede dene' },
          B: { label: '600 makineye aynı anda uygula', short: 'Hepsine aynı anda uygula' }
        },
        roleLens: {
          backend: 'Senin gözünden: Bir veritabanı göçünü hiç test etmeden 600 sunucuda koşar mıydın?',
          devops: 'Senin gözünden: Canary dağıtım tam olarak bu durum için mi var?',
          qa: 'Senin gözünden: Bu script\'in başarılı olduğunu hangi gözlemle anlarsın?',
          mobil: 'Senin gözünden: Bir uygulama güncellemesini kullanıcıların %1\'ine açmakla %100\'üne açmak arasındaki fark ne?'
        },
        hint: 'Sabah her şeyi bozan şey neydi? Bu script onunla aynı yolu mu izliyor?',
        socratic: [
          'Bu sabahki kesinti nasıl başlamıştı? Bir şey herkese aynı anda mı gitti?',
          'Script\'in dosya deseni, silmesi gerekenden fazlasını siliyorsa bunu ne zaman fark edersin?',
          'BitLocker şifrelemesi olan bir makinede bu script dosyaya ulaşabilir mi?',
          'Beş dakika beklemenin maliyeti ile 600 makineyi bozmanın maliyetini nasıl karşılaştırırsın?'
        ],
        outcomes: {
          A: {
            title: 'Beş dakikada iki hata yakalandı',
            what: 'Script\'i laboratuvardaki bir test makinesinde denedin. Silme deseninin başka bir sürücü dosyasını da yakaladığı ve BitLocker\'lı makinelerde hiç çalışmadığı görüldü. Deseni düzelttiniz, BitLocker için ayrı yol açtınız.',
            why: 'Küçük bir örneklemde denemek (canary), hatanın etki alanını 1 makineyle sınırladı. Bu sabahki krizi yaratan şey, kontrolsüz toplu dağıtımın ta kendisiydi.',
            real: 'Gerçekte şirketin sonradan açıkladığı önlemlerden biri, içerik güncellemelerini önce küçük bir gruba, sonra kademeli olarak dağıtmaktı.'
          },
          B: {
            title: '40 makine daha gitti',
            what: 'Script tüm ağda koştu. Geniş silme deseni bir sürücü dosyasını da sildi; laboratuvardaki 40 makine artık hiç açılmıyor. BitLocker\'lı makinelerde ise hiçbir şey değişmedi.',
            why: 'Test edilmemiş bir değişikliği bütün filoya aynı anda uygulamak, sabahki olayın aynısını küçük ölçekte tekrarladı.',
            real: 'Gerçek olayda kök neden, hatalı bir içeriğin doğrulama aşamasında yakalanmayıp herkese aynı anda dağıtılmasıydı.'
          }
        },
        lesson: {
          term: 'Canary / kademeli dağıtım',
          text: 'Değişikliği önce küçük bir gruba uygula, gözle, sonra genişlet. Hatanın bedeli, kaç makineye aynı anda ulaştığıyla çarpılır.'
        }
      },
      {
        id: 'k3',
        tag: 'Karar 3 · KVKK',
        clock: '10:20',
        topic: 'kvkk',
        situation: 'Servisler kâğıda geçti. Ameliyathane sorumlusu, öğleden sonraki ameliyat listesinin fotoğrafını çekmiş: hasta adı, T.C. kimlik no, tanı. "Bunu 120 kişilik hastane WhatsApp grubuna atalım, herkes görsün" diyor.',
        question: 'Listeyi nasıl paylaşacaksın?',
        sample: { name: 'Ayşe K*** ', tc: '123******01', protocol: 'P-48213', dx: 'Kolesistektomi' },
        options: {
          A: { label: 'Maskele: yalnızca protokol no ve baş harflerle paylaş', short: 'Maskeleyerek paylaş' },
          B: { label: 'Fotoğrafı olduğu gibi gruba at', short: 'Olduğu gibi at' }
        },
        roleLens: {
          backend: 'Senin gözünden: Log\'a T.C. numarası yazan bir servis yazsaydın, kod incelemesinde kim fark ederdi?',
          devops: 'Senin gözünden: Kriz anında kurulan geçici kanal, ne kadar süre "geçici" kalır?',
          qa: 'Senin gözünden: Maskeleme kuralının doğru çalıştığını hangi örnekle test ederdin?',
          mobil: 'Senin gözünden: Bir fotoğraf 120 telefona indiğinde, onu geri alma şansın var mı?'
        },
        hint: 'Ameliyathanedeki ekibin hastayı tanımak için gerçekten hangi bilgiye ihtiyacı var?',
        socratic: [
          'Ameliyathane ekibi hastayı doğru tanımak için en az hangi bilgilere ihtiyaç duyar?',
          'Tanı bilgisi, sıradan bir kişisel veriden farklı mı korunuyor? Neden?',
          'Bir fotoğraf 120 kişisel telefona indiğinde, o veri üzerindeki kontrol kimde kalır?',
          'Kriz bir kuralı askıya almak için yeterli bir gerekçe mi, yoksa kuralların asıl sınandığı an mı?'
        ],
        outcomes: {
          A: {
            title: 'Liste işini gördü, veri güvende',
            what: 'Listeyi protokol numarası, baş harfler ve ameliyat saatiyle yeniden yazdın. Ameliyathane kimlik doğrulamasını bilekliklerden yaptı. Gruba giden mesajda tanı ve T.C. no yoktu.',
            why: 'Amaç için gereken en az veriyi paylaşmak (veri minimizasyonu), işi durdurmadan riski düşürdü.',
            real: 'KVKK\'da sağlık verisi özel nitelikli kişisel veridir (md. 6) ve veri sorumlusu yetkisiz erişimi önleyecek teknik ve idari tedbirleri almakla yükümlüdür (md. 12).'
          },
          B: {
            title: 'Fotoğraf 120 telefonda',
            what: 'Liste gruba gitti. Bir saat sonra gruptaki biri fotoğrafı başka bir gruba iletti. Ad, T.C. no ve tanı artık kimin telefonunda olduğu bilinmeyen bir yerde.',
            why: 'Kriz baskısı, en az veri ilkesini atlatmayı "mantıklı" gösterdi. Ama paylaşılan bir fotoğraf geri alınamaz.',
            real: 'Sağlık verisinin yetkisiz paylaşımı KVKK md. 6 ve md. 12 kapsamında ihlaldir; veri sorumlusunun ihlali Kurula bildirme yükümlülüğü doğar.'
          }
        },
        lesson: {
          term: 'Veri minimizasyonu',
          text: 'Amaç için gereken en az veriyi paylaş. Sağlık verisi özel nitelikli kişisel veridir; kriz anı istisna değildir.'
        }
      }
    ],

    endings: {
      A: {
        code: 'SON A',
        tone: 'iyi',
        title: '11:30 · Acil ve ameliyathane ayakta, veri güvende',
        text: 'Kritik birimleri öne aldın, düzeltmeyi önce bir makinede denedin ve listeyi maskeledin. Öğleden sonraki ameliyatların çoğu yapıldı. Akşamki olay sonrası toplantıda raporun, hastanenin yeni "kriz runbook"unun ilk sayfası oldu.'
      },
      B: {
        code: 'SON B',
        tone: 'kötü',
        title: 'Sistemler ayakta ama KVKK ihlali',
        text: 'Ekranlar akşama doğru açıldı. Pazartesi sabahı hukuk birimi seni arıyor: ameliyat listesinin fotoğrafı hastane dışına çıkmış. Teknik kriz bitti, hukuki kriz başlıyor.'
      },
      C: {
        code: 'SON C',
        tone: 'geç',
        title: 'Akşama kadar sürdü, veri güvende',
        text: 'Hasta verisini korudun ama kurtarma geç başladı ya da toplu deneme yeni makineler düşürdü. 14 ameliyattan 9\'u ertelendi. Kimse zarar görmedi; ama aynı sabah, aynı kararlar daha az bedelle verilebilirdi.'
      }
    },

    goalLessons: {
      mimari: 'k1',
      kriz: 'k2',
      kvkk: 'k3'
    }
  };

  /* ADR-3: Son belirleme kuralı tek fonksiyonda. */
  function decideEnding(choices) {
    if (choices.k3 === 'B') return 'B';
    if (choices.k1 === 'A' && choices.k2 === 'A') return 'A';
    return 'C';
  }

  const api = { STORY, decideEnding };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
