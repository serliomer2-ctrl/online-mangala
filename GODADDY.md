# 🌐 Dijital Mangala — GoDaddy kurulum rehberi
### GitHub + Deluxe Web Hosting · Ekim 2026

Bu rehber, oyunu **GoDaddy Node.js Hosting** ile yayınlamayı anlatır. Kod **GitHub'dan** çekilir; paket olarak **Deluxe Web Hosting** kullanılır. Sonunda oyun kendi adresinde (örneğin **https://oyun.serli.net**) 7/24 açık olur. Sunucu hiç uyumaz, hesaplar kalıcıdır, GitHub'a her yüklemende oyun kendiliğinden güncellenir.

```
GitHub reposu (mangala-online)  ──push──►  GoDaddy Node.js Hosting (Node 22, hiç uyumaz)
                                               ├── https://oyun.serli.net  (otomatik SSL + CDN)
                                               └── GoDaddy MySQL veritabanı (hesaplar kalıcı)
```

> ℹ️ GoDaddy Node.js Hosting yeni bir ürün (Ağustos 2026'da çıktı). Paneldeki düğme adları zamanla biraz değişebilir. Bir şeyi bulamazsan benzer adlı olana bak ya da 7/24 GoDaddy desteğine (sohbet/telefon) "Node.js Hosting" diye sor.

---

## 📋 İçindekiler
1. [Bilmen gereken kurallar](#0️⃣-önce-bilmen-gereken-kurallar)
2. [GitHub reposunu güncelle](#1️⃣-github-reposunu-v36ya-güncelle)
3. [GoDaddy'de GitHub'ı bağla](#2️⃣-godaddyde-uygulamayı-oluştur-ve-githubı-bağla)
4. [MySQL veritabanı](#3️⃣-mysql-veritabanını-ekle-şart)
5. [Şifreler ve ortam değişkenleri](#4️⃣-ortam-değişkenlerini-şifreleri-gir)
6. [Önizlemede test](#5️⃣-önizlemede-test-et)
7. [Yayınla ve alan adı bağla](#6️⃣-yayınla-ve-alan-adını-bağla)
8. [E-posta ile kod (Brevo)](#7️⃣-e-posta-ile-kod-gönderme-isteğe-bağlı-ücretsiz)
9. [Güncelleme](#8️⃣-oyunu-güncelleme)
10. [Sorun giderme](#9️⃣-sorun-giderme)
11. [Ekler: yerel deneme, kurucu, yönetim, özellikler](#-ekler)

---

## 0️⃣ Önce bilmen gereken kurallar

GoDaddy uygulamalardan bazı şeyler ister. Oyun hepsine hazır:

| GoDaddy kuralı | Oyunda durum |
|---|---|
| Node.js 22, sürekli açık süreç | ✅ Çevrimiçi maçlar (WebSocket) için gerekli; uygun |
| `package.json`'da `name`, `version`, `main`, **`build`**, **`start`** | ✅ v3.6'da eklendi |
| Kökte `package-lock.json` ve herkese açık npm adresi (`.npmrc`) | ✅ İkisi de var |
| `PORT` değişkenini dinle, `0.0.0.0`'a bağlan | ✅ Hazır |
| Dışarıya sadece **80/443** ve GoDaddy'nin **kendi MySQL'i** açık | ✅ Oyun MySQL'i kendisi tanır. ❌ **MongoDB Atlas burada çalışmaz** |
| SMTP (normal e-posta portu) kapalı | ✅ E-posta Brevo'nun HTTPS API'siyle gider, etkilenmez |

**Paketin:** Deluxe Web Hosting → **10 yayınlanmış uygulama** hakkı var (Economy'de 1). Node.js Hosting pakete dahil, ek ücret yok. HTTPS, Cloudflare CDN, güvenlik duvarı (WAF) ve MySQL de dahil.

---

## 1️⃣ GitHub reposunu v3.6'ya güncelle

GitHub'daki repon büyük ihtimalle **eski sürüm**. Eski sürümde GoDaddy için gereken şeyler yok: `build` komutu, MySQL desteği (`mysql2`) ve `.npmrc`. GoDaddy'yi bağlamadan **önce** repoyu güncelle.

### Repoda olması gereken dosyalar
```
mangala-online/            ← reponun KÖKÜ (package.json burada olmalı)
├── .gitignore
├── .npmrc
├── GODADDY.md             (bu rehber)
├── godaddy.env.example    (şifre şablonu; içinde gerçek şifre yok)
├── package.json
├── package-lock.json
├── server.js
├── lib/                   (db.js, mail.js, staff.js)
└── public/                (index.html, css/, js/, icons/, manifest.json, sw.js)
```
❌ **Yükleme:** `node_modules`, `data`, `.env`, gerçek şifre içeren herhangi bir dosya. Repo herkese açıksa (Public) şifreler herkese görünür!

### Adım adım (tarayıcıdan, program kurmadan)
1. **github.com** → giriş yap → reponu aç (`mangala-online`).
2. **Eski, artık gereksiz dosyaları sil.** Repoda varsa her birine tıkla → sağ üstte **⋯ → Delete file** → **Commit changes**:
   - `render.yaml`, `wordpress-embed.html`, `KURULUM.md`
3. **Add file → Upload files**.
4. Bilgisayarındaki `mangala-online` klasörünü aç. Şunları seçip sayfaya **sürükle-bırak**:
   - `public` ve `lib` klasörleri
   - `server.js`, `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`, `GODADDY.md`, `godaddy.env.example`
   > Aynı adlı eski dosyaların üstüne yazılır.
   > `.npmrc` ve `.gitignore` noktayla başlar. Windows'ta görünmüyorsa: Dosya Gezgini → **Görünüm → Göster → Gizli öğeler**.
5. Aşağıda **Commit changes** → *Commit directly to the `main` branch* → **Commit changes**.
6. **Kontrol et:**
   - Reponun ana sayfasında `package.json` görünüyor. Bir alt klasörün içinde değil.
   - `package.json`'a tıkla. İçinde `"build": "echo build"` ve `"mysql2"` yazıyor.
   - `lib/db.js`'e tıkla. İçinde `mysqlDB` geçiyor.

> 📁 Dosyalar repoda `mangala-online/package.json` gibi **bir klasörün içindeyse** iki çözüm var: ya köke taşı, ya da GoDaddy'de bağlarken "root directory / uygulama klasörü" seçeneği çıkarsa oraya `mangala-online` yaz.

---

## 2️⃣ GoDaddy'de uygulamayı oluştur ve GitHub'ı bağla

1. **godaddy.com/hosting/nodejs** → **Start for Free**. Deluxe paketinin olduğu GoDaddy hesabıyla giriş yap.
2. Yeni uygulama oluştur. Ad: `mangala`.
3. **Bölge (region): Europe**. Türkiye'ye en yakını bu; maçlarda gecikme az olur.
   > ⚠️ Bölge ilk dağıtımdan **önce** seçilir; sonradan değiştirmek zor olabilir.
4. Kaynak olarak **Connect GitHub**'ı seç.
5. GitHub izin ekranı açılır → **Only select repositories** → `mangala-online` → **Install / Authorize**.
   > GoDaddy'ye bütün repolarına erişim vermek zorunda değilsin; sadece bu repo yeterli.
6. Repo: `mangala-online`, dal (branch): **`main`**.
7. GoDaddy kodu çeker, `npm install` → `npm run build` → `npm start` çalıştırır. 1-2 dakika bekle.
8. Bitince bir **özel önizleme linki (private preview)** verir. Aç; giriş ekranı gelmeli.
   - Kurulum hata verirse **GoDaddy AI** sebebini sade dille anlatır, bazen düzeltme de önerir. Hata metnini bana gönderebilirsin.

---

## 3️⃣ MySQL veritabanını ekle (ŞART)

Veritabanı eklemezsen oyun hesapları geçici bir dosyaya yazar. **GitHub'a her yüklemede bütün hesaplar silinebilir.**

1. Uygulama sayfasında **Database / Veritabanı** bölümü → **MySQL ekle**.
2. GoDaddy veritabanını kurar. Bağlantı bilgilerini (sunucu, port, kullanıcı, şifre, veritabanı adı) uygulamaya **ortam değişkeni** olarak verir.
3. Oyun bu değişkenleri **adlarından kendiliğinden bulur**. `MYSQL_HOST`, `DB_HOST`, `DATABASE_HOST` gibi farklı adlandırmaları da tanır.
4. Tabloları (`mg_users`, `mg_sessions`, `mg_meta`) oyun ilk açılışta kendisi oluşturur. SQL yazman gerekmez.
5. Gerekirse uygulamayı bir kez **yeniden dağıt (Redeploy)**, değişkenler yüklensin.

**Çalıştığını nasıl anlarsın?**
- **Logs** bölümünde şu satır görünür: `Veritabanı: MySQL bağlandı ✓ (…)`
- Oyunda kurucu ile gir → **Yönetim Paneli → Genel** → Veritabanı: **✅ MySQL**

**`⚠️ Dosya` yazıyorsa:** Veritabanı ekranındaki bilgileri 4. adımda şu adlarla elle ekle:
`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`.
Logs'ta `MySQL bağlantısı başarısız: …` yazıyorsa o satırı bana gönder.

> GoDaddy'nin veritabanı ekranında tablo görüntüleyici ve SQL editörü var. Oyuncuların kayıtları `mg_users` tablosunda durur. Elle değiştirmen gerekmez; her şey Yönetim Paneli'nden yapılır.

---

## 4️⃣ Ortam değişkenlerini (şifreleri) gir

GoDaddy'de gizli bilgiler **.env** biçiminde eklenir. Şifrelenerek saklanır ve uygulama açılırken yüklenir. GitHub'a **asla** gitmez.

1. Uygulama sayfası → **Environment variables / Secrets (.env)**.
2. Repodaki `godaddy.env.example` dosyasının içeriğini kopyala. `< >` içindeki yerleri kendi bilgilerinle doldurup yapıştır:

| Değişken | Ne işe yarar | Zorunlu mu |
|---|---|---|
| `FOUNDER_USER` | Kurucu (en üst yetki) kullanıcı adı. Boşsa `kurucu` | önerilir |
| `FOUNDER_PASSWORD` | **Kurucu şifresi. Güçlü bir şifre yaz (12+ karakter)!** | **EVET** |
| `ADMIN_PASSWORD` | Test `admin` hesabının (sınırsız para) şifresi | **EVET** |
| `BREVO_API_KEY` | E-posta ile kod göndermek için (7. adım) | hayır |
| `MAIL_FROM` | Brevo'da doğruladığın gönderici adresi | Brevo varsa evet |

> ❌ `MONGODB_URI`, `PORT` ve `INVITE_URL` **ekleme**. MongoDB burada çalışmaz, portu GoDaddy kendisi verir. Davet linkleri de oyunun kendi adresine kendiliğinden gider.

3. Kaydet → gerekirse **Redeploy**.

> 🔐 Kurucu ve admin hesapları **ilk açılışta** bu şifrelerle oluşturulur. Değişkeni sonradan değiştirmek şifreyi değiştirmez. O zaman oyunda **Profil → Şifre Değiştir** kullan.

---

## 5️⃣ Önizlemede test et

Önizleme linkinde şu listeyi kontrol et:

- [ ] Giriş ekranı açılıyor
- [ ] Kurucu adın + şifrenle giriş yapılıyor
- [ ] Yönetim Paneli → Genel: **✅ MySQL**
- [ ] Yeni bir hesap aç, çık, tekrar gir: ilerleme duruyor
- [ ] **Çevrimiçi test:** iki tarayıcıda (biri gizli pencere) iki hesapla gir → **Oyna → Çevrimiçi → Rakip Bul** → maç başlıyor
  > Bu testle **WebSocket**'in çalıştığından emin olursun. GoDaddy sürekli açık bağlantıları desteklediğini söylüyor, ama "WebSocket" kelimesini belgelerinde açıkça yazmıyor. "Bağlanıyor…"da takılırsa 9. bölüme bak.
- [ ] **Oyna → Arkadaşla Oyna** → kopyalanan link başka tarayıcıda açılınca aynı odaya giriyor

---

## 6️⃣ Yayınla ve alan adını bağla

1. Uygulama sayfası → **Publish (Yayınla)**. Deluxe paketin seçili olsun.
2. Alan adı sorulunca:
   - **`oyun.serli.net`** (önerilen): serli.net'te başka bir site varsa ona dokunmaz.
   - **`serli.net`** (ana adres): sadece serli.net'te başka bir site **yoksa** veya kapatacaksan. Bağlarsan o adreste artık sadece oyun açılır.
3. DNS:
   - **serli.net GoDaddy'de kayıtlıysa ve DNS'i GoDaddy'deyse:** tek tıkla kendiliğinden ayarlanır.
   - **DNS başka yerdeyse** (ör. Cloudflare): GoDaddy eklemen gereken **A** ve **CNAME** kayıtlarını gösterir. Onları DNS sağlayıcında ekle (alt alan adı için ad: `oyun`).
   - Panel alt alan adı yazmana izin vermezse destekten iste: "Node.js uygulamamı **oyun.serli.net**'e bağlamak istiyorum."
4. DNS yayılması birkaç dakika ile birkaç saat sürer. **HTTPS sertifikası kendiliğinden gelir.**
5. **https://oyun.serli.net** adresini aç. Oyun açılmalı. Bu adresi herkese gönderebilirsin.

> 📱 Oyuncular siteyi telefona **uygulama gibi** kurabilir (PWA):
> - Android/Chrome: ⋮ → **Uygulamayı yükle**
> - iPhone/Safari: Paylaş → **Ana Ekrana Ekle**

---

## 7️⃣ E-posta ile kod gönderme (isteğe bağlı, ücretsiz)

Kurmazsan da oyun çalışır. O durumda doğrulama ve şifre sıfırlama kodları **Yönetim Paneli → Genel → Bekleyen e-posta kodları**'nda görünür; oyuncuya kodu sen iletirsin.

Gerçek e-posta için (Brevo, günde 300 e-posta ücretsiz):
1. **brevo.com** → ücretsiz hesap aç.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender** → ad `Dijital Mangala`, e-posta olarak kendi adresin (ör. `oyun@serli.net`). Gelen e-postadaki bağlantıyla **doğrula**.
   > serli.net alan adını Brevo'da **Domains** bölümünde doğrularsan e-postalar spam'e daha az düşer. Brevo sana GoDaddy DNS'ine eklenecek kayıtları verir.
3. Sağ üst → **SMTP & API → API Keys → Generate a new API key** → kopyala.
4. GoDaddy → uygulaman → **.env**'e ekle: `BREVO_API_KEY=...` ve `MAIL_FROM=oyun@serli.net` → Redeploy.
5. Yönetim Paneli → Genel: **E-posta servisi ✅**.

> Alternatif: `RESEND_API_KEY` + `MAIL_FROM` ile Resend de çalışır (o da HTTPS kullanır).

---

## 8️⃣ Oyunu güncelleme

1. Yeni dosyaları GitHub'a yükle: **Add file → Upload files** → **Commit changes**.
2. GoDaddy `main` dalındaki değişikliği görür ve **kendiliğinden yeniden kurar**. Yayındaki adres güncellenmezse panelde bir kez **Publish**'e bas.
3. Hesaplar, kurucu ayarları, etkinlikler ve ranklar MySQL'de durduğu için **güncellemede kaybolmaz**.
4. Oyuncuların tarayıcısı yeni sürümü kendiliğinden alır. Telefonda hemen görünmezse uygulamayı kapatıp açsınlar.

---

## 9️⃣ Sorun giderme

| Belirti | Çözüm |
|---|---|
| GoDaddy repoyu/uygulamayı bulamıyor | `package.json` reponun kökünde mi? Değilse 1. bölümdeki 📁 notuna bak. GitHub izninde bu repo seçili mi? |
| Kurulum (build) hatası | GoDaddy AI'ın açıklamasını oku. Çoğu zaman sebep eski `package.json`'dır (`build` satırı yok). 1. bölümü tekrar yap. |
| Yönetim panelinde **⚠️ Dosya** | MySQL eklenmemiş ya da değişkenler okunamamış → 3. bölüm |
| Çevrimiçi maç "Bağlanıyor…"da kalıyor | Sayfayı yenile. Düzelmezse destek: "Node.js uygulamamda WebSocket (wss://) bağlantısı açılmıyor; Cloudflare/WAF WebSocket'e izin veriyor mu?" |
| Kurucu şifresi çalışmıyor | Hesap daha önce başka şifreyle oluşmuş olabilir; ortam değişkeni sadece ilk oluşturmada kullanılır. |
| E-posta kodu gelmiyor | Spam klasörü · Brevo'da gönderici doğrulandı mı · `MAIL_FROM` aynı adres mi |
| Değişiklik görünmüyor | GoDaddy panelinde son dağıtım bitti mi? Sayfayı **Ctrl+F5** ile yenile. |
| Eski Render/MongoDB hesapları | GoDaddy'deki MySQL boş başlar. Taşımak istersen söyle, aktarma betiği yazarım. |

**Kayıtlar (Logs):** uygulama sayfasının **Logs** bölümünde. GoDaddy desteği de bu kayıtları görebilir; ürün içinden uygulamaya özel destek kaydı açılabilir.

---

## ✅ Kısa kontrol listesi
1. [ ] GitHub: eski dosyalar silindi, v3.6 yüklendi, `package.json` kökte
2. [ ] GoDaddy: uygulama oluşturuldu, **Europe**, GitHub `main` bağlı
3. [ ] **MySQL** eklendi → Logs: `MySQL bağlandı ✓`
4. [ ] `.env`: `FOUNDER_PASSWORD`, `ADMIN_PASSWORD` (+ isteğe bağlı Brevo)
5. [ ] Önizlemede iki tarayıcıyla çevrimiçi maç oynandı
6. [ ] **Publish** → `oyun.serli.net` bağlandı, HTTPS açılıyor
7. [ ] Kurucu ile giriş → Yönetim Paneli → Genel: ✅ MySQL

---

## 📎 Ekler

### A) Kendi bilgisayarında denemek
1. **nodejs.org** → LTS sürümünü kur.
2. `mangala-online` klasöründe boş bir yere **Shift + Sağ tık → Terminalde aç**, sırayla şunları çalıştır:

```bash
npm install
```

```bash
npm start
```

3. Tarayıcıda **http://localhost:3000** aç.
   - Kurucu: `kurucu` / `kurucu`
   - Test admin: `admin` / `admin`
   Bu şifreler sadece yerel denemede geçerli.

Yerelde hesaplar `data/db.json` dosyasında tutulur. Bu dosya GitHub'a gitmez.

### B) Kurucu ve admin güvenliği
- **Kurucu** her şeyi yapabilir: ranklar, etkinlikler, arayüz tasarımı, **Oyun Ayarları** (şans çarkı, mağaza indirimi, bulmaca ödülü, duyuru şeridi). Mağazadaki bütün eşyalara da otomatik sahip olur.
- **admin** test hesabının parası sınırsızdır.
- İnternette ikisinin şifresi **mutlaka** güçlü olmalı.
- Birine Admin rankı verdiğinde o kişi kendi parasıyla devam eder; sadece yönetim yetkileri açılır.

### C) Ranklar

| Rank | Seviye | Varsayılan yetkiler |
|---|---|---|
| 👑 Kurucu | 1000 | Her şey (kilitli, tek kişi) |
| 🛡️ Admin | 100 | Ban, susturma, uyarı, para/XP/eşya, Elo, şifre, ad değiştirme, sıfırlama, silme, rank verme, etkinlikler |
| 🔨 Moderatör | 50 | Atma, uyarı, susturma, ban, duyuru, maç kapatma, kayıtlar |
| 💬 Destek | 30 | Uyarı, susturma, maçları görme |
| ▶️ YouTuber · 🎥 Medya · 💎 VIP | 10 / 10 / 5 | Sadece rozet |

- Kurucu **Yönetim Paneli → Ranklar**'da yeni rank ekler ve her yetkiyi tek tek açıp kapatır.
- Herkes sadece kendinden düşük seviyedekilere işlem yapabilir.
- Tüm işlemler **Kayıtlar** sekmesine yazılır.

### D) Yönetim paneli sekmeleri
- **📊 Genel:** oyuncu ve maç sayıları, veritabanı ve e-posta durumu, duyuru gönderme
- **👥 Oyuncular:** ara → para/XP/eşya ver, Elo, uyar, sustur, banla, at, şifre, ad değiştir, rank ver, sıfırla, sil
- **🎮 Maçlar:** canlı maçları gör, izle, kapat
- **🏅 Ranklar** (kurucu): rank oluştur ve düzenle
- **🎊 Etkinlik Planlayıcı:** şablonlardan süreli etkinlik; başlat, kısalt, uzat, bitir
- **🎨 Arayüz Tasarımcısı** (kurucu): ana menü başlığı, tema rengi, afiş, haber, geri sayım, kısayol butonları
- **⚙️ Oyun Ayarları** (kurucu):
  - şans çarkı dilimleri ve ücreti
  - mağaza indirimi (yüzde ve bitiş tarihi)
  - Günün Bulmacası ödül çarpanı
  - kayan duyuru şeridi
  - "Hepsini hesabıma ekle"
- **📜 Kayıtlar:** kim, ne zaman, kime, ne yaptı

### E) Sunucu ayarları (`server.js` en üstü)

```js
const TURN_MS = 30000;            // çevrimiçi hamle süresi
const BLITZ_MS = 8000;            // yıldırım hamle süresi
const START_ELO = 1000, ELO_K = 32;
const TOUR_PRIZE = { 4: { coins: 300, xp: 200 }, 8: { coins: 600, xp: 400 } };  // turnuvalar ücretsiz
const RENAME_COOLDOWN_DAYS = 7;   // kullanıcı adı kaç günde bir değişir
```

### F) Oyundaki özellikler (özet)
- **Oyun:**
  - zorunlu etkileşimli eğitim ("kuralları biliyor musun?" sorusuyla), atlanabilir oyun rehberi
  - 5 seviye bot
  - modlar: Klasik, Yıldırım, Ters, Gizemli, Süper Güç Kartları, Mini (3 taş), Dev (6 taş)
  - 20 bulmaca + **Günün Bulmacası**
  - **Yan Yana** (aynı cihazda 2 kişi)
  - botlara karşı Geri Al / İpucu, hamle önizleme
- **Çevrimiçi:**
  - hızlı ve dereceli maç (Elo ligleri)
  - özel oda, `?room=` davet linki
  - arkadaşlar ve davet, izleyici modu, turnuvalar
  - 30 saniyede yeniden bağlanma
- **İlerleme:**
  - mağaza: tahta, taş, el, avatar, çerçeve, emoji, mesaj, **canlı arka plan**, **zafer efekti**
  - sezon kartı, süreli etkinlikler, günlük görevler, **Şans Çarkı**
  - başarımlar ve unvanlar
  - profilde maç geçmişi grafiği ve kuyu ısı haritası
- **Eğlence:**
  - slow-motion K.O., kombo efektleri, Masayı Devir
  - sonuç kartı paylaşma, tekrar izleme + Yapay Zekâ Koçu
  - kamera ile el kontrolü (HTTPS gerekir)
  - Twitch Chat Plays
- **Ayarlar:**
  - dil (TR/EN)
  - müzik temaları (Lo-fi, Çay Ocağı, 8-Bit, Gece), ses seviyeleri
  - grafik kalitesi (Yüksek / Normal / Düşük)
  - titreşim, yatay/dikey tahta

### Kaynaklar
- GoDaddy Node.js Hosting: https://www.godaddy.com/hosting/nodejs
- GoDaddy duyurusu (paketler, GitHub, MySQL, alan adı): https://www.godaddy.com/resources/news/godaddy-nodejs-hosting-launch
- GoDaddy geliştirici belgesi: https://developer.godaddy.com/en/docs/api-users/hosting/workflows/deploy-nodejs-app
- Uygulama kuralları özeti (portlar, MySQL, SMTP, package.json): https://webhosting.today/2026/08/21/godaddy-launches-node-js-hosting-and-publishes-the-rules-apps-must-follow/
