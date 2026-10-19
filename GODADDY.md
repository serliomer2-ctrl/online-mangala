# 🌐 Dijital Mangala'yı GoDaddy'de Yayınlama
### Hiç bilmeyen biri için, adım adım · GitHub + Deluxe Web Hosting · Ekim 2026

> Bu rehberde alan adın **serli.net** olarak yazıldı. Başka bir alan adı kullanıyorsan, gördüğün her **serli.net** yerine kendi alan adını koy.

---

# BÖLÜM A — Önce büyük resmi anla (5 dakika oku, sonra her şey kolay)

## A1. Bu iş hangi parçalardan oluşuyor?

Oyunun internette çalışması için **4 parça** var:

```
┌──────────────┐  dosyaları    ┌──────────────────────────────┐
│  1. GITHUB   │ ───────────►  │  2. GODADDY NODE.JS HOSTING  │
│ (kodun durduğu│   çeker      │  (oyunun 7/24 çalıştığı yer)  │
│  depo/klasör) │               │                              │
└──────────────┘               │  ┌────────────────────────┐  │
                               │  │ 3. MySQL VERİTABANI     │  │
                               │  │ (hesaplar, paralar,     │  │
                               │  │  ranklar burada saklanır)│  │
                               │  └────────────────────────┘  │
                               └──────────────┬───────────────┘
                                              │
                               ┌──────────────▼───────────────┐
                               │ 4. ALAN ADI (oyun.serli.net) │
                               │ oyuncuların yazdığı adres     │
                               └──────────────────────────────┘
```

| Parça | Ne işe yarar? | Benzetme |
|---|---|---|
| **GitHub** | Oyunun dosyalarının internetteki deposu | Dosyaların durduğu dolap |
| **GoDaddy Node.js Hosting** | Oyunu durmadan çalıştıran bilgisayar (sunucu) | Oyunun oynandığı salon |
| **MySQL** | Hesapların, paraların, eşyaların, rankların kaydı | Salonun defteri |
| **Alan adı** | Oyuncuların tarayıcıya yazdığı adres | Salonun kapı adresi |

## A2. ⚠️ EN ÖNEMLİ KONU: cPanel mi, Node.js Hosting mi?

GoDaddy hesabında **iki ayrı panel** var. Karıştırma; bu rehberdeki işin tamamı **Node.js Hosting** panelinde yapılır.

| | **cPanel** | **Node.js Hosting paneli** ✅ |
|---|---|---|
| Nedir? | Deluxe Web Hosting'in klasik yönetim paneli | GoDaddy'nin 2026'da çıkardığı yeni, ayrı panel |
| Ne için? | PHP siteleri, WordPress, e-posta kutuları, dosya yöneticisi | **Node.js uygulamaları, yani bizim oyun** |
| Nereden açılır? | GoDaddy → Ürünlerim → Web Hosting → **Yönet / cPanel Admin** | **godaddy.com/hosting/nodejs** adresinden |
| İçindeki MySQL | cPanel → "MySQL Databases" (**KULLANMAYACAĞIZ**) | Uygulamaya özel, yönetilen MySQL (**BUNU KULLANACAĞIZ**) |

### Neden cPanel'deki MySQL olmaz?
GoDaddy, Node.js uygulamalarının dışarıyla konuşmasını kısıtlar. Uygulama sadece şunlara bağlanabilir:
- web adresleri (port 80 ve 443),
- **kendi panelinde verilen MySQL**.

cPanel'deki MySQL'e bağlanmak 3306 numaralı porttan olur ve bu port **kapalıdır**. Bağlanmaya çalışırsan oyun açılır ama hesaplar kaydedilmez.

> ✅ **Kısacası:** cPanel'e hiç girmen gerekmiyor. Deluxe paketin sadece "yayınlama hakkı" için lazım; Node.js Hosting o pakete dahil (Deluxe'te 10 uygulama hakkı).
> ❌ cPanel'de **"Setup Node.js App"** diye bir menü görürsen onu da kullanma. O eski yöntem paylaşımlı sunucuda çalışır; sürekli açık kalma ve çevrimiçi maç bağlantısı (WebSocket) garanti değildir.

## A3. Bu rehberde geçen kelimeler (mini sözlük)

| Kelime | Anlamı |
|---|---|
| **Repo (depo)** | GitHub'daki proje klasörün. Seninkinin adı: `mangala-online` |
| **Commit** | GitHub'da "değişiklikleri kaydet" demek |
| **Branch (dal) – `main`** | Reponun ana sürümü. GoDaddy buradan çeker |
| **Deploy / Dağıtım** | GoDaddy'nin kodu çekip kurması ve çalıştırması |
| **Önizleme (Preview)** | Sadece senin görebildiğin deneme adresi |
| **Yayınlama (Publish)** | Oyunu herkese açmak |
| **Ortam değişkeni (.env)** | Şifre gibi gizli ayarlar. Kodun içine değil, GoDaddy paneline yazılır |
| **Logs (Kayıtlar)** | Sunucunun "ne yapıyorum" yazdığı ekran. Hata ararken bakılır |
| **DNS** | Alan adının hangi sunucuya gideceğini söyleyen kayıtlar |
| **Alt alan adı** | `oyun.serli.net` gibi, ana adresin önüne bir kelime eklenmiş adres |

## A4. Başlamadan önce elinde olması gerekenler
- [ ] **GoDaddy hesabı** ve içinde **Deluxe Web Hosting** (var ✅)
- [ ] **serli.net** alan adı (GoDaddy'de kayıtlıysa en kolayı)
- [ ] **GitHub hesabı** ve içinde `mangala-online` reposu
- [ ] Bilgisayarındaki **`mangala-online` klasörü** (bu rehberin de içinde olduğu klasör)
- [ ] Kurucu hesabı için aklında tutacağın **güçlü bir şifre** (en az 12 karakter, harf + rakam + işaret)

Toplam süre: ilk seferde yaklaşık **30–45 dakika** (DNS beklemesi hariç).

---

# BÖLÜM B — Kurulum adımları

## ADIM 1 — GitHub'daki dosyaları yeni sürümle değiştir (10 dk)

**Neden?** GitHub'daki repo eski sürüm. GoDaddy'nin istediği üç şey eski sürümde yok:
- `package.json` içinde **`build`** satırı,
- **MySQL** desteği,
- `.npmrc` dosyası.

Güncellemezsen GoDaddy kurulumda hata verir.

### 1.1 Eski, gereksiz dosyaları sil
1. **github.com**'a gir → sağ üstte profil resmin → **Your repositories** → **mangala-online**.
2. Dosya listesinde şunlar varsa sırayla sil:
   - `render.yaml`
   - `wordpress-embed.html`
   - `KURULUM.md`

   Silmek için: dosyanın adına tıkla → sağ üstte **⋯** (üç nokta) → **Delete file** → yeşil **Commit changes** → açılan pencerede tekrar **Commit changes**.

### 1.2 Yeni dosyaları yükle
1. Reponun ana sayfasına dön → **Add file** → **Upload files**.
2. Bilgisayarında **`mangala-online`** klasörünü aç.
   > `.npmrc` ve `.gitignore` görünmüyorsa: Dosya Gezgini → üstte **Görünüm** → **Göster** → **Gizli öğeler**'i işaretle.
3. Şunları seç ve GitHub sayfasındaki kutuya **sürükle-bırak**:

   | Yükle ✅ | Açıklama |
   |---|---|
   | `public` (klasör) | Oyunun ekranları, resimleri, kodları |
   | `lib` (klasör) | Veritabanı, e-posta, yetki kodları |
   | `server.js` | Sunucunun ana dosyası |
   | `package.json` | GoDaddy'ye "nasıl kurulur, nasıl başlar" bilgisi |
   | `package-lock.json` | Paketlerin tam sürümleri |
   | `.npmrc` | Paketlerin nereden indirileceği |
   | `.gitignore` | GitHub'a gitmemesi gerekenlerin listesi |
   | `GODADDY.md` | Bu rehber |
   | `godaddy.env.example` | Şifre şablonu (içinde gerçek şifre yok) |

   | Yükleme ❌ | Neden |
   |---|---|
   | `node_modules` | Çok büyük; GoDaddy kendisi kurar |
   | `data` | Senin bilgisayarındaki deneme hesapları |
   | Gerçek şifre yazdığın herhangi bir dosya | Repo herkese açıksa herkes görür! |

4. Yükleme çubuğu bitince aşağıda **Commit changes** kutusu çıkar → **Commit directly to the `main` branch** seçili kalsın → yeşil **Commit changes**.

### 1.3 Kontrol et (çok önemli)
- Reponun **ana sayfasında**, bir klasörün içinde değil, doğrudan `package.json`, `server.js`, `lib`, `public` görünüyor mu?
- `package.json`'a tıkla. İçinde şu satırlar var mı?
  ```json
  "build": "echo build",
  "start": "node server.js"
  ```
  ve `"mysql2"` kelimesi geçiyor mu?

> 📁 **Dosyalar `mangala-online/` diye bir klasörün içinde kaldıysa:** GoDaddy `package.json`'ı bulamaz. Ya repoyu silip dosyaları doğrudan köke yükle, ya da Adım 2'de GoDaddy "Root directory / Uygulama klasörü" sorarsa oraya `mangala-online` yaz.

---

## ADIM 2 — GoDaddy'de uygulamayı oluştur ve GitHub'a bağla (5 dk)

1. Tarayıcıda **godaddy.com/hosting/nodejs** adresine git → **Start for Free** (veya **Başla**).
   > Bu, cPanel değil; Node.js Hosting'in kendi panelidir (A2'ye bak).
2. **Deluxe paketinin olduğu GoDaddy hesabınla** giriş yap.
3. **Yeni uygulama** oluştur:
   - **Ad:** `mangala`
   - **Bölge (Region):** **Europe**. Türkiye'ye en yakın bölge bu; maçlarda gecikme azalır.
     > ⚠️ Bölge sadece ilk kurulumdan önce seçilir. Sonradan değiştirmek zor olabilir.
4. Kaynak olarak **Connect GitHub / GitHub'ı bağla**'ya tıkla.
5. GitHub'ın izin sayfası açılır:
   - **Only select repositories** seç → listeden **mangala-online**'ı işaretle → **Install / Authorize**.
   > Böylece GoDaddy sadece bu repoyu görür; diğer repolarına erişemez.
6. GoDaddy'ye dönünce:
   - **Repository:** `mangala-online`
   - **Branch:** `main`
   - (Soruyorsa) **Root directory:** boş bırak. Dosyaların bir klasörde kaldıysa `mangala-online` yaz.
7. **Deploy / Dağıt**. GoDaddy şunları sırayla yapar:
   `npm install` (paketleri kurar) → `npm run build` → `npm start` (oyunu başlatır). 1–2 dakika sürer.
8. Bitince bir **Preview (Önizleme) linki** verir. Tıkla → oyunun **giriş ekranını** görmelisin. 🎉
   - **Hata çıkarsa:** GoDaddy'nin yapay zekâsı sebebini sade bir dille açıklar. En sık sebep, Adım 1'in eksik kalması (eski `package.json`). Hata metnini kopyalayıp bana gönderebilirsin.

> Şu an oyun çalışıyor ama **hesaplar henüz kalıcı değil**. Hemen Adım 3'e geç.

---

## ADIM 3 — MySQL veritabanını ekle (5 dk) ⭐ EN ÖNEMLİ ADIM

### 3.1 MySQL neden gerekli?
Oyuncu hesap açtığında kullanıcı adı, şifresi (şifrelenmiş olarak), parası, eşyaları, seviyesi ve rankı bir yere yazılmalı. O yer **MySQL veritabanı**.

**MySQL eklemezsen** oyun her şeyi geçici bir dosyaya yazar. GitHub'a her güncelleme yüklediğinde veya sunucu yeniden başladığında **bütün hesaplar silinebilir.**

### 3.2 Nereden eklenir? (cPanel'den DEĞİL!)
1. **Node.js Hosting panelinde** (godaddy.com/hosting/nodejs) uygulamana (**mangala**) tıkla.
2. Uygulamanın sayfasında **Database / Veritabanı** sekmesini veya bölümünü bul.
3. **Add database / MySQL ekle**'ye tıkla. Ad sorarsa `mangala` yaz.
4. GoDaddy veritabanını birkaç saniyede kurar. Her yayınlanan uygulamaya bir MySQL dahildir; ek ücret yok.

> Bu bölümü göremiyorsan: bazı hesaplarda veritabanı ancak uygulama **yayınlandıktan** (Adım 6) sonra açılabiliyor. O zaman önce 4. ve 6. adımları yap, sonra buraya dön.

### 3.3 Oyun veritabanına nasıl bağlanıyor? (senin bir şey yapman gerekmiyor)
- GoDaddy veritabanını kurunca bağlantı bilgilerini uygulamaya gizli **ortam değişkenleri** olarak verir: sunucu adresi, port, kullanıcı adı, şifre, veritabanı adı.
- Oyun bu bilgileri **adlarından kendiliğinden bulur**. `MYSQL_HOST`, `DB_HOST`, `DATABASE_HOST`… gibi farklı adlandırmaların hepsini tanır.
- Oyun ilk açılışta **3 tabloyu kendisi oluşturur**. SQL bilmene gerek yok:

  | Tablo | İçinde ne var |
  |---|---|
  | `mg_users` | Her oyuncunun hesabı ve bütün ilerlemesi |
  | `mg_sessions` | Kimin giriş yapmış olduğu (oturumlar) |
  | `mg_meta` | Kurucu ayarları: ranklar, etkinlikler, arayüz, şans çarkı… |

5. Değişkenlerin yüklenmesi için uygulamayı bir kez **Redeploy / Yeniden dağıt** (ya da **Restart**).

### 3.4 Çalıştığını nasıl anlarım?
**Yol 1 — Logs (Kayıtlar):** Uygulama sayfası → **Logs**. Şu satırı ara:
```
Veritabanı: MySQL bağlandı ✓ (MYSQL_HOST, MYSQL_PORT, ...)
Mangala sunucusu çalışıyor
```
**Yol 2 — Oyunun içinden:** Kurucu ile giriş yap (Adım 4'ten sonra) → **Yönetim Paneli → 📊 Genel** → **Veritabanı** kutusunda **✅ MySQL** yazmalı.

### 3.5 "MySQL bağlandı" yazmıyorsa ne yapmalı?

| Logs'ta gördüğün | Anlamı | Çözüm |
|---|---|---|
| `Veritabanı: data/db.json (... kalıcı değil!)` | Oyun MySQL bilgisini bulamadı | Veritabanı ekranındaki bilgileri (host, port, user, password, database) Adım 4'te **elle** şu adlarla ekle: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` → Redeploy |
| `MySQL bağlantısı başarısız: Access denied` | Kullanıcı adı veya şifre yanlış | Değerleri veritabanı ekranından tekrar kopyala |
| `MySQL bağlantısı başarısız: ETIMEDOUT / ECONNREFUSED` | Yanlış sunucu adresi, ya da cPanel MySQL'i girilmiş | Sadece **Node.js Hosting panelindeki** veritabanının bilgilerini kullan, cPanel'inkini değil |
| Başka bir hata | — | O satırı kopyalayıp bana gönder |

> 🔎 **Kayıtları görmek istersen:** veritabanı ekranında GoDaddy'nin **tablo görüntüleyicisi ve SQL editörü** var. `mg_users` tablosuna bakıp kayıtlı oyuncuları görebilirsin. **Elle değiştirme**; para verme, ban gibi her işi oyunun Yönetim Paneli'nden yap.

---

## ADIM 4 — Şifreleri ve gizli ayarları gir (5 dk)

**Neden?** Kurucu şifresi gibi bilgiler GitHub'a yazılırsa herkes görebilir. Bu yüzden GoDaddy panelinde **şifreli olarak** saklanırlar.

1. Uygulama sayfası → **Environment variables / Secrets / .env** bölümü.
2. Bilgisayarında `mangala-online` klasöründeki **`godaddy.env.example`** dosyasını **Not Defteri** ile aç.
3. İçindekileri kopyala ve GoDaddy'deki kutuya yapıştır. Sonra `< >` işaretli yerleri kendi bilgilerinle değiştir (`< >` işaretlerini de sil):

```
FOUNDER_USER=omer
FOUNDER_PASSWORD=Mangala#2026!Guclu
ADMIN_PASSWORD=Baska#Sifre2026
```
*(Bunlar örnek; kendi şifrelerini yaz.)*

| Değişken | Ne işe yarar | Zorunlu mu? |
|---|---|---|
| `FOUNDER_USER` | **Kurucu** hesabının kullanıcı adı (en üst yetki). Boşsa `kurucu` olur | Önerilir |
| `FOUNDER_PASSWORD` | Kurucu şifresi | **EVET.** Girmezsen şifre `kurucu` olur, herkes kurucu olabilir! |
| `ADMIN_PASSWORD` | Test hesabı `admin`'in şifresi (sınırsız paralı hesap) | **EVET**, aynı sebepten |
| `BREVO_API_KEY` | E-postayla doğrulama kodu göndermek (Adım 7) | Hayır |
| `MAIL_FROM` | E-postaların gönderen adresi (Adım 7) | Brevo varsa evet |

**Eklememen gerekenler:**
- ❌ `PORT`: GoDaddy kendisi verir.
- ❌ `MONGODB_URI`: MongoDB GoDaddy'de çalışmaz.
- ❌ MySQL bilgileri: GoDaddy kendisi ekler. Sadece 3.5'teki sorun çıkarsa elle eklenir.

4. **Save / Kaydet** → **Redeploy / Yeniden dağıt**.

> 🔐 **Bilmen gereken:** Kurucu ve admin hesapları sunucu **ilk açıldığında** bu şifrelerle oluşturulur. Hesap bir kere oluştuktan sonra buradaki şifreyi değiştirmek hesabın şifresini **değiştirmez**. Şifre değiştirmek için oyunda: **Profil → Hesap → Şifre Değiştir**.

---

## ADIM 5 — Önizlemede her şeyi dene (10 dk)

Önizleme linkini aç ve listeyi sırayla işaretle:

- [ ] Giriş ekranı açılıyor.
- [ ] `FOUNDER_USER` + `FOUNDER_PASSWORD` ile giriş yapılıyor. İsminin yanında 👑 Kurucu rozeti var.
- [ ] **Yönetim Paneli → 📊 Genel** → Veritabanı: **✅ MySQL**.
- [ ] Çıkış yap → **Kayıt Ol** ile yeni bir deneme hesabı aç → çık → tekrar gir → hesap duruyor.
- [ ] **Çevrimiçi maç testi:**
  1. Normal pencerede kurucu ile gir.
  2. **Gizli pencerede** (Ctrl+Shift+N) deneme hesabıyla gir.
  3. İkisinde de **Oyna → Çevrimiçi → Rakip Bul**.
  4. Maç başlamalı ve taşlar iki tarafta da hareket etmeli.

  > Bu test **WebSocket**'in çalıştığını gösterir. WebSocket, iki oyuncu arasındaki anlık bağlantıdır. GoDaddy belgelerinde açıkça yazmadığı için mutlaka dene. "Bağlanıyor…"da takılırsa Bölüm C'ye bak.
- [ ] **Oyna → Arkadaşla Oyna** → link kopyalanır → gizli pencerede aç → aynı odaya giriyor.

Hepsi tamamsa yayına hazırsın. ✅

---

## ADIM 6 — Herkese aç ve alan adını bağla (5 dk + DNS beklemesi)

### 6.1 Hangi adresi kullanmalıyım?

| Seçenek | Ne zaman? |
|---|---|
| **`oyun.serli.net`** ⭐ önerilen | serli.net'te başka bir site varsa ya da ileride olabilecekse. Ana siten bozulmaz. |
| **`serli.net`** | serli.net'te **hiçbir site yoksa** ve sadece oyun olacaksa. Bağlarsan o adreste artık sadece oyun açılır. |

### 6.2 Yayınla
1. Uygulama sayfası → **Publish / Yayınla**.
2. Paket sorarsa **Deluxe Web Hosting**'i seç.
3. Alan adı sorarsa **Connect domain / Alan adı bağla** → **serli.net**'i seç → alt alan adı kutusuna **`oyun`** yaz. Sonuç `oyun.serli.net` olur.

### 6.3 DNS ayarı (adresin sunucuyu bulması)
- **serli.net GoDaddy'de kayıtlı ve DNS'i GoDaddy'de ise** (çoğu durumda öyledir): GoDaddy DNS'i **tek tıkla kendisi ayarlar**. Bir şey yapmana gerek yok.
- **DNS başka bir yerdeyse** (Cloudflare gibi): GoDaddy sana **A** ve/veya **CNAME** kayıtlarını gösterir. O sitenin DNS ekranına gir, aynen ekle. Ad kısmına `oyun` yaz.
- **Alt alan adı yazacak yer çıkmazsa:** GoDaddy desteğine (7/24 sohbet) şunu yaz: *"Node.js Hosting uygulamamı oyun.serli.net alt alan adına bağlamak istiyorum."*

> 🔎 DNS'in nerede olduğunu öğrenmek için: GoDaddy → **Ürünlerim** → **Alan Adları** → serli.net → **DNS**. Kayıtları burada görüyorsan DNS GoDaddy'dedir.

### 6.4 Bekle ve aç
- DNS'in yayılması **birkaç dakika ile birkaç saat** sürebilir.
- **HTTPS (kilit işareti)** kendiliğinden gelir; SSL için ayrıca bir şey alman veya kurman gerekmez.
- Tarayıcıya **https://oyun.serli.net** yaz. Oyun açıldıysa bitti! 🎉 Artık bu adresi herkese gönderebilirsin.

> 📱 Oyuncular oyunu telefona **uygulama gibi** kurabilir:
> - Android/Chrome: ⋮ → **Uygulamayı yükle**
> - iPhone/Safari: Paylaş → **Ana Ekrana Ekle**

---

## ADIM 7 — (İsteğe bağlı) E-postayla kod göndermek

**Neden?** Oyuncular e-postalarını doğrulamak, şifrelerini sıfırlamak veya kullanıcı adlarını değiştirmek için 6 haneli bir kod alır.
**Kurmazsan ne olur?** Oyun yine çalışır. Kodlar **Yönetim Paneli → Genel → Bekleyen e-posta kodları**'nda görünür ve oyuncuya kodu sen söylersin.

**Neden Brevo?** GoDaddy, Node.js uygulamalarının normal e-posta (SMTP) göndermesini engeller. Brevo ise web adresi (HTTPS) üzerinden çalıştığı için engellenmez. Günde 300 e-posta ücretsiz.

1. **brevo.com** → **Sign up free** → hesap aç.
2. **Gönderici ekle:** sağ üst menü → **Senders, Domains & Dedicated IPs** → **Senders** → **Add a sender**
   - Ad: `Dijital Mangala`
   - E-posta: kullanacağın adres (örn. `oyun@serli.net`)
   - O adrese gelen e-postadaki bağlantıya tıklayıp **doğrula**.
   > `oyun@serli.net` gibi bir adresin yoksa cPanel → **E-posta Hesapları**'ndan açabilirsin. cPanel'in bu işte tek kullanım yeri burası, o da isteğe bağlı. Ya da kendi Gmail adresini kullan.
3. **(Önerilir) Alan adını doğrula:** **Domains** → **Add a domain** → serli.net. Brevo sana birkaç DNS kaydı verir. GoDaddy → Alan Adları → serli.net → **DNS** → **Kayıt ekle** ile aynen ekle. Böylece e-postalar spam'e daha az düşer.
4. **API anahtarı al:** sağ üst menü → **SMTP & API** → **API Keys** → **Generate a new API key** → kopyala.
5. GoDaddy → uygulaman → **Environment variables** → ekle:
   ```
   BREVO_API_KEY=kopyaladığın-anahtar
   MAIL_FROM=oyun@serli.net
   ```
   → **Kaydet** → **Redeploy**.
6. Kontrol: **Yönetim Paneli → Genel** → **E-posta servisi ✅**.

---

## ADIM 8 — Oyunu güncellemek (bundan sonra her seferinde)

1. Yeni dosyaları GitHub'a yükle: repo → **Add file → Upload files** → sürükle-bırak → **Commit changes**.
2. GoDaddy `main` dalındaki değişikliği görür ve **kendiliğinden yeniden kurar** (1–2 dk).
   - Yayındaki adres güncellenmezse: Node.js Hosting paneli → uygulaman → **Publish**'e bir kez daha bas.
3. **Hiçbir şey kaybolmaz.** Hesaplar, paralar, ranklar, etkinlikler ve kurucu ayarları MySQL'de durur.
4. Oyuncuların tarayıcısı yeni sürümü kendisi alır. Telefonda hemen görünmezse uygulamayı kapatıp açsınlar.

---

# BÖLÜM C — Sorun giderme

| Ne oldu? | Neden olabilir? | Ne yapmalı? |
|---|---|---|
| GoDaddy "package.json bulunamadı" diyor | Dosyalar repoda bir klasörün içinde | Adım 1.3'teki 📁 notu |
| Kurulum (build) hatası | GitHub'da eski `package.json` duruyor | Adım 1'i tekrar yap, `"build"` satırını kontrol et |
| Yönetim panelinde **⚠️ Dosya** yazıyor | MySQL eklenmemiş ya da bilgiler okunamamış | Adım 3, özellikle 3.5 |
| Çevrimiçi maç "Bağlanıyor…"da kalıyor | WebSocket bağlantısı engelleniyor olabilir | Sayfayı yenile. Düzelmezse GoDaddy desteğine yaz: *"Node.js uygulamamda WebSocket (wss://) bağlantısı açılmıyor, Cloudflare/WAF WebSocket'e izin veriyor mu?"* |
| Kurucu şifresi kabul edilmiyor | Hesap önceden başka bir şifreyle oluşmuş | Ortam değişkeni sadece ilk oluşturmada kullanılır; bana yaz, sıfırlama yolunu gösteririm |
| E-posta kodu gelmiyor | Brevo ayarı eksik | Spam klasörü · gönderici doğrulandı mı · `MAIL_FROM` aynı adres mi |
| `oyun.serli.net` açılmıyor | DNS henüz yayılmadı | Birkaç saat bekle; önizleme linkinin hâlâ çalıştığını kontrol et |
| Değişiklik görünmüyor | Dağıtım bitmedi ya da tarayıcı eski sürümü gösteriyor | Panelde son dağıtım "tamamlandı" mı bak; sayfada **Ctrl+F5** |
| cPanel'de MySQL oluşturdum, çalışmıyor | cPanel MySQL'ine Node.js uygulamasından ulaşılamaz | Onu kullanma; Node.js Hosting panelindeki veritabanını kullan (Adım 3.2) |

**Hata ararken önce:** Node.js Hosting paneli → uygulaman → **Logs**. Kırmızı veya "başarısız" yazan satırı kopyalayıp bana gönder.
**GoDaddy desteği** 7/24 sohbet ve telefonla çalışır, uygulama kayıtlarını görebilir. Ürünün içinden bu uygulamaya özel destek kaydı açabilirsin.

---

# BÖLÜM D — Sık sorulan sorular

**cPanel'i hiç kullanacak mıyım?**
Bu oyun için hayır. Tek istisna: Brevo'da `oyun@serli.net` gibi bir gönderici adresi istiyorsan, o e-posta kutusunu cPanel'den açabilirsin.

**Ekstra para ödeyecek miyim?**
Hayır. Node.js Hosting, MySQL, HTTPS ve CDN Deluxe paketine dahil. Trafik veya istek başına ücret yok. Brevo'nun ücretsiz planı da yeterli.

**Sunucu uyur mu, kapanır mı?**
Hayır, sürekli açık çalışır. Paket süresi biterse uygulama durur ama silinmez; paket yenilenince geri gelir.

**Oyuncular artarsa ne olur?**
Deluxe paketin limitleri genelde yeterlidir. Yavaşlama olursa GoDaddy desteğine sor ya da Ultimate'e geçebilirsin.

**Hesapların yedeği var mı?**
Hesaplar GoDaddy'nin yönetilen MySQL'inde durur. Ek güvenlik istersen veritabanı ekranındaki SQL editörüyle tabloları dışa aktarabilirsin. İstersen sana otomatik yedek alan bir özellik ekleyebilirim.

**Kurucu hesabımı başkası ele geçirebilir mi?**
`FOUNDER_PASSWORD` güçlü olduğu sürece hayır. Şifreni kimseyle paylaşma; rank verdiğin moderatörler bile kurucu yetkilerine sahip olmaz.

---

# ✅ Son kontrol listesi
1. [ ] **GitHub:** eski dosyalar silindi, yeni dosyalar yüklendi, `package.json` kökte ve içinde `build` var
2. [ ] **Node.js Hosting** (cPanel değil!): `mangala` uygulaması, bölge **Europe**, GitHub `main` bağlı
3. [ ] **MySQL** Node.js Hosting panelinden eklendi → Logs: `MySQL bağlandı ✓`
4. [ ] **Ortam değişkenleri:** `FOUNDER_USER`, `FOUNDER_PASSWORD`, `ADMIN_PASSWORD` (+ Brevo)
5. [ ] **Önizleme:** iki pencereyle çevrimiçi maç oynandı
6. [ ] **Publish** → `oyun.serli.net` bağlandı, kilit işaretiyle (HTTPS) açılıyor
7. [ ] Kurucu ile giriş → Yönetim Paneli → Genel: **✅ MySQL**

Takıldığın adımın ekran görüntüsünü ya da Logs'taki hata satırını gönder, birlikte çözelim. 🙂

---

# 📎 Ekler

### Ek 1 — Kendi bilgisayarında denemek
1. **nodejs.org** → **LTS** sürümünü indir ve kur.
2. `mangala-online` klasöründe boş bir yere **Shift + Sağ tık → Terminalde aç**. Sırayla şunları çalıştır:

```bash
npm install
```

```bash
npm start
```

3. Tarayıcıda **http://localhost:3000** aç.
   - Kurucu: `kurucu` / `kurucu`
   - Test admin: `admin` / `admin`
   Bu şifreler **sadece bilgisayarında** geçerli.

Yerelde hesaplar `data/db.json` dosyasına yazılır. Bu dosya GitHub'a gitmez.

### Ek 2 — Ranklar

| Rank | Seviye | Varsayılan yetkiler |
|---|---|---|
| 👑 Kurucu | 1000 | Her şey (kilitli, tek kişi) |
| 🛡️ Admin | 100 | Ban, susturma, uyarı, para/XP/eşya, Elo, şifre, ad değiştirme, sıfırlama, silme, rank verme, etkinlikler |
| 🔨 Moderatör | 50 | Atma, uyarı, susturma, ban, duyuru, maç kapatma, kayıtlar |
| 💬 Destek | 30 | Uyarı, susturma, maçları görme |
| ▶️ YouTuber · 🎥 Medya · 💎 VIP | 10 / 10 / 5 | Sadece rozet |

- Kurucu, **Yönetim Paneli → Ranklar**'da yeni rank ekler ve her yetkiyi tek tek açıp kapatır.
- Herkes sadece kendinden düşük seviyedekilere işlem yapabilir.
- Her işlem **Kayıtlar** sekmesine yazılır.

### Ek 3 — Yönetim Paneli sekmeleri
- **📊 Genel:** oyuncu ve maç sayıları, veritabanı ve e-posta durumu, herkese duyuru
- **👥 Oyuncular:** ara → para/XP/eşya ver, Elo, uyar, sustur, banla, at, şifre, ad değiştir, rank ver, sıfırla, sil
- **🎮 Maçlar:** canlı maçları gör, izle, kapat
- **🏅 Ranklar** (kurucu): rank oluştur ve düzenle
- **🎊 Etkinlik Planlayıcı:** süreli etkinlikler; başlat, kısalt, uzat, bitir
- **🎨 Arayüz Tasarımcısı** (kurucu): menü başlığı, tema rengi, afiş, haber, geri sayım, kısayol butonları
- **⚙️ Oyun Ayarları** (kurucu): şans çarkı, mağaza indirimi, Günün Bulmacası ödülü, kayan duyuru şeridi, "Hepsini hesabıma ekle"
- **📜 Kayıtlar:** kim, ne zaman, kime, ne yaptı

### Ek 4 — Sunucu ayarları (`server.js` en üstü)

```js
const TURN_MS = 30000;            // çevrimiçi hamle süresi (ms)
const BLITZ_MS = 8000;            // yıldırım hamle süresi (ms)
const START_ELO = 1000, ELO_K = 32;
const TOUR_PRIZE = { 4: { coins: 300, xp: 200 }, 8: { coins: 600, xp: 400 } };  // turnuvalar ücretsiz
const RENAME_COOLDOWN_DAYS = 7;   // kullanıcı adı kaç günde bir değişebilir
```

### Ek 5 — Oyundaki özellikler (özet)
- **Oyun:**
  - zorunlu etkileşimli kural eğitimi ("kuralları biliyor musun?" sorusuyla), atlanabilir oyun rehberi
  - 5 seviye bot
  - modlar: Klasik, Yıldırım, Ters, Gizemli, Süper Güç Kartları, Mini (3 taş), Dev (6 taş)
  - 20 bulmaca + Günün Bulmacası
  - Yan Yana (aynı cihazda 2 kişi)
  - botlara karşı Geri Al / İpucu, hamle önizleme
- **Çevrimiçi:**
  - hızlı ve dereceli maç (Elo ligleri)
  - özel oda ve davet linki
  - arkadaşlar, izleyici modu, turnuvalar
  - 30 saniyede yeniden bağlanma
- **İlerleme:**
  - mağaza: tahta, taş, el, avatar, çerçeve, emoji, mesaj, canlı arka plan, zafer efekti
  - sezon kartı, etkinlikler, günlük görevler, Şans Çarkı
  - başarımlar ve unvanlar
  - profilde maç geçmişi grafiği ve kuyu ısı haritası
- **Eğlence:**
  - slow-motion K.O., kombolar, Masayı Devir
  - sonuç kartı paylaşma, tekrar izleme + Yapay Zekâ Koçu
  - kamera ile el kontrolü
  - Twitch Chat Plays
- **Ayarlar:**
  - Türkçe/İngilizce
  - müzik temaları, ses seviyeleri
  - grafik kalitesi
  - titreşim, yatay/dikey tahta

### Kaynaklar
- GoDaddy Node.js Hosting: https://www.godaddy.com/hosting/nodejs
- GoDaddy duyurusu (paketler, GitHub, MySQL, alan adı): https://www.godaddy.com/resources/news/godaddy-nodejs-hosting-launch
- GoDaddy geliştirici belgesi: https://developer.godaddy.com/en/docs/api-users/hosting/workflows/deploy-nodejs-app
- Uygulama kuralları özeti (portlar, MySQL, SMTP): https://webhosting.today/2026/08/21/godaddy-launches-node-js-hosting-and-publishes-the-rules-apps-must-follow/
- cPanel MySQL'e uzaktan bağlanma (neden kullanmadığımız): https://www.godaddy.com/help/connect-remotely-to-a-mysql-database-in-my-web-hosting-cpanel-account-16103
