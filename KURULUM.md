# Dijital Mangala – Ücretsiz Sunucu Kurulum Rehberi (v3)

Bu rehber oyunu **internette 7/24 açık** hale getirir. Bilgisayarının açık kalmasına gerek yok.
Kullanılan ücretsiz servisler:

| Ne için | Servis | Ücretsiz plan |
|---|---|---|
| Oyun sunucusu | **Render.com** | Web servisi, WebSocket destekli |
| Hesaplar (kullanıcı adı, şifre, ilerleme) | **MongoDB Atlas** | M0 kümesi, 512 MB |
| E-posta ile kod gönderme (isteğe bağlı) | **Brevo** | Günde 300 e-posta |

> ⚠️ Render'ın ücretsiz planında **dosyalar kalıcı değildir**: sunucu her uyuduğunda ya da yeniden başladığında silinir. Bu yüzden hesapların kaybolmaması için **MongoDB Atlas şarttır** (Adım 3).
> ⚠️ Render'ın ücretsiz planı normal e-posta (SMTP) bağlantısını engeller. Bu yüzden e-postalar Brevo'nun **HTTP API'si** ile gönderilir.

---

## 📁 Dosyalar

| Dosya | Görevi |
|---|---|
| `server.js` | Sunucu: sayfayı yayınlar, hesaplar, admin, çevrimiçi maçlar, turnuvalar, izleyici |
| `lib/db.js` | Veritabanı (MongoDB veya yerel deneme için `data/db.json`) |
| `lib/mail.js` | E-posta gönderimi (Brevo / Resend API) |
| `public/index.html`, `public/css/style.css` | Oyunun sayfası ve tasarımı |
| `public/js/engine.js` | Oyun kuralları ve yapay zekâ (sunucu da aynısını kullanır, hile yapılamaz) |
| `public/js/data.js` | Mağaza, botlar, bulmacalar, başarımlar, eğitim metinleri |
| `public/js/i18n.js` | Dil dosyası (Türkçe / English) |
| `public/js/audio.js` | Ses efektleri ve lo-fi müzik (dosyasız, anlık üretilir) |
| `public/js/app.js`, `public/js/play.js` | Oyunun arayüzü ve oyun akışı |
| `public/manifest.json`, `public/sw.js`, `public/icons/` | Uygulama olarak yükleme (PWA) |
| `render.yaml` | Render için hazır ayarlar |

---

## 1️⃣ Önce kendi bilgisayarında dene

1. **Node.js** kur: <https://nodejs.org> → **LTS**.
2. `mangala-online` klasöründe terminal aç (boş yere **Shift + Sağ tık → Terminalde aç**):
   ```bash
   npm install
   ```
   ```bash
   npm start
   ```
3. Tarayıcıda <http://localhost:3000> aç.
4. **Kurucu ile giriş (en üst rank):** kullanıcı adı `kurucu`, şifre `kurucu`.
   **Test admin (sınırsız para):** kullanıcı adı `admin`, şifre `admin`.
5. Çevrimiçi denemek için ikinci bir tarayıcıda (veya gizli pencerede) başka bir hesapla gir ve **Oyna → Çevrimiçi → Rakip Bul**.

Yerelde hesaplar `data/db.json` dosyasında tutulur.

---

## 2️⃣ GitHub'a yükle

1. <https://github.com> → ücretsiz hesap → **+ → New repository** → ad: `mangala-online` → **Create repository**.
2. **uploading an existing file** → şunları sürükle: `public` klasörü, `lib` klasörü, `server.js`, `package.json`, `package-lock.json`, `render.yaml`, `.gitignore`, `KURULUM.md`
   > ❌ `node_modules` ve `data` klasörlerini **yükleme**.
3. **Commit changes**.

---

## 3️⃣ MongoDB Atlas (hesapların kalıcı olması için)

1. <https://www.mongodb.com/cloud/atlas/register> → ücretsiz kayıt (Google ile de olur).
2. **Create a cluster** → **M0 (Free)** seç → sağlayıcı fark etmez, bölge **Frankfurt** (veya en yakını) → **Create Deployment**.
3. Açılan pencerede bir **veritabanı kullanıcısı** oluştur:
   - Username: `mangala`
   - Password: **Autogenerate** → şifreyi bir yere kopyala 📋
   - **Create Database User**.
4. **Network Access** (sol menü) → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) → **Confirm**.
   > Render'ın ücretsiz sunucularının sabit IP'si olmadığı için bu gerekli.
5. **Database → Connect → Drivers** → **Node.js** → bağlantı adresini kopyala. Şuna benzer:
   ```
   mongodb+srv://mangala:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
   `<db_password>` yazan yere 3. adımdaki şifreyi koy. Bu senin **MONGODB_URI** değerin.

---

## 4️⃣ Render'da sunucuyu kur

1. <https://render.com> → **GitHub ile giriş**.
2. **+ New → Web Service** → `mangala-online` deposunu seç → **Connect**.
3. Ayarlar:

   | Ayar | Değer |
   |---|---|
   | Name | `mangala-online` |
   | Region | `Frankfurt (EU Central)` |
   | Branch | `main` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

4. **Environment Variables** bölümüne ekle (**Add Environment Variable**):

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | 3. adımda hazırladığın adres |
   | `FOUNDER_USER` | kurucu kullanıcı adın (ör. `omer`) — boşsa `kurucu` |
   | `FOUNDER_PASSWORD` | kurucu için **güçlü** bir şifre |
   | `ADMIN_PASSWORD` | test admin hesabı için güçlü bir şifre |

5. **Create Web Service**. Kayıtlarda (Logs) şunları görünce hazırdır:
   ```
   Veritabanı: MongoDB bağlandı ✓
   Mangala sunucusu çalışıyor
   ```
6. Üstteki adres (ör. `https://mangala-online.onrender.com`) artık oyunun! Arkadaşlarına gönder.

> 💡 Kısa yol: **+ New → Blueprint** seçersen `render.yaml` ayarları otomatik doldurur; sadece ortam değişkenlerini girersin.

### 🔐 Kurucu & admin güvenlik notu (ÖNEMLİ)
- **Kurucu** hesabı sunucu ilk açıldığında `FOUNDER_USER` / `FOUNDER_PASSWORD` ile oluşur (boşsa `kurucu` / `kurucu`). Kurucu her şeyi yapabilir. **İnternette bu şifreyi mutlaka değiştir**; yoksa herkes kurucu olabilir.
- **Test admin** hesabı (`admin`) `ADMIN_PASSWORD` ile oluşur (boşsa `admin`). Parası sınırsızdır (∞), tüm botlar ve bulmacalar açıktır.
- Şifreleri ortam değişkeniyle vermediysen ilk girişte **Profil → Şifre Değiştir** ile değiştir.
- Birine **Admin rankı** verdiğinde o kişi kendi hesabı ve kendi parasıyla devam eder. Sadece yönetim yetkileri açılır.

---

## 5️⃣ E-posta ile kod gönderme (isteğe bağlı, ücretsiz)

Kurmazsan da oyun çalışır: o durumda doğrulama ve şifre sıfırlama kodları **Admin Paneli → Bekleyen e-posta kodları** bölümünde görünür ve oyuncuya kodu sen iletirsin.

Gerçek e-posta göndermek için:
1. <https://www.brevo.com> → ücretsiz hesap aç.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: gönderici adı `Dijital Mangala`, e-posta olarak kendi adresin. Gelen e-postadaki bağlantıyla **doğrula**.
3. Sağ üst menü → **SMTP & API → API Keys → Generate a new API key** → anahtarı kopyala.
4. Render → servisin → **Environment** → ekle:

   | Key | Value |
   |---|---|
   | `BREVO_API_KEY` | kopyaladığın anahtar |
   | `MAIL_FROM` | 2. adımda doğruladığın e-posta |

5. **Save Changes**. Sunucu yeniden başlar. Admin panelinde "E-posta servisi ✅" görünmeli.

> 💡 Kendi adresinden (ör. gmail) gönderilen e-postalar bazen **spam** klasörüne düşebilir. Oyuncularına spam klasörüne de bakmalarını söyle.
> Alternatif: `RESEND_API_KEY` + `MAIL_FROM` ile Resend de kullanılabilir. Ancak Resend başkalarına e-posta göndermek için kendi alan adını (domain) ister.

---

## 6️⃣ Telefona uygulama gibi yükleme (PWA)

- **Android / Chrome:** siteyi aç → menü (⋮) → **Uygulamayı yükle / Ana ekrana ekle**.
- **iPhone / Safari:** Paylaş (□↑) → **Ana Ekrana Ekle**.
- **Bilgisayar / Chrome-Edge:** adres çubuğundaki **yükle** simgesi.

Oyun tam ekran açılır. İnternet yoksa bile botlarla ve bulmacalarla oynanabilir.

---

## 7️⃣ Ücretsiz planda bilmen gerekenler

- **Render:** 15 dakika kimse girmezse sunucu uyur, biri girince yaklaşık **1 dakikada** uyanır (oyun "Sunucu uyanıyor..." yazar). Maç sırasında uyumaz.
- **Hesaplar** MongoDB'de durur; sunucu uyusa da yeniden başlasa da **kaybolmaz**. Oyuncu hangi cihazdan girerse girsin parası, eşyaları, seviyesi ve başarımları gelir.
- Aynı hesap iki cihazda **aynı anda** açıksa en son kaydedilen ilerleme geçerli olur. Diğer cihaz "hesabın başka yerden güncellendi" uyarısı alır.
- **Misafir** olarak oynayanların ilerlemesi sadece kendi cihazında durur. Hesap açarlarsa ilerlemeleri hesaba aktarılır.

---

## 8️⃣ Oyunu güncellemek

Dosyayı değiştir → GitHub'da **Add file → Upload files** ile aynı yere yükle → **Commit**. Render 1-3 dakikada otomatik yayınlar.
Değişiklik telefonda hemen görünmezse uygulamayı kapatıp tekrar aç.

---

## ⚙️ Ayarlar (`server.js` en üstü)

```js
const TURN_MS = 30000;            // normal hamle süresi
const BLITZ_MS = 8000;            // yıldırım hamle süresi
const START_ELO = 1000, ELO_K = 32;
const TOUR_PRIZE = { 4: { coins: 300, xp: 200 }, 8: { coins: 600, xp: 400 } };  // turnuvalar ÜCRETSİZ, şampiyona sabit ödül
const RENAME_COOLDOWN_DAYS = 7;   // kullanıcı adı kaç günde bir değiştirilebilir
```
Ligler: Bronz (0+), Gümüş (1100+), Altın (1300+), Elmas (1500+), Mangala Ustası (1700+).

---

## 👑 Ranklar ve yetkiler

| Rank | Seviye | Neler yapabilir (varsayılan) |
|---|---|---|
| 👑 Kurucu | 1000 | Her şey + rank oluşturma/düzenleme, oyuncuya sınırsız para verme (kilitli, tek kişi) |
| 🛡️ Admin | 100 | Ban, susturma, uyarı, para/XP/eşya, Elo, şifre, ad değiştirme, sıfırlama, silme, rank verme, etkinlik planlama |
| 🔨 Moderatör | 50 | Atma, uyarı, susturma, ban, duyuru, maçları kapatma, kayıtlar |
| 💬 Destek | 30 | Uyarı, susturma, maçları görme |
| ▶️ YouTuber · 🎥 Medya · 💎 VIP | 10 / 10 / 5 | Sadece rozet (isminin yanında herkese görünür) |

- Kurucu **Yönetim Paneli → Ranklar** bölümünde yeni rank ekleyebilir, ad/simge/renk/seviye ve her yetkiyi tek tek açıp kapatabilir.
- Herkes sadece **kendinden düşük seviyedeki** oyunculara işlem yapabilir ve sadece kendinden düşük rankları verebilir.
- **Sınırsız para** ayrı bir ayardır: kurucuda ve `admin` test hesabında açıktır. Kurucu, oyuncu detayından kişiye özel açıp kapatabilir.
- Tüm yönetim işlemleri **Kayıtlar** sekmesine yazılır: kim, ne zaman, kime, ne yaptı.

## 🎊 Etkinlik planlayıcı ve 🎨 arayüz tasarımcısı
- **Etkinlik Planlayıcı:** Hazır şablonlardan etkinlik ekle (Çift Kuralı Festivali, 2x Para Hafta Sonu, XP Yağmuru, Bulmaca Maratonu, Yıldırım Kupası...). Şunlar ayarlanır:
  - hedef türü ve sayısı,
  - ödül (🪙 / XP / eşya),
  - para ve XP çarpanı,
  - başlangıç ve bitiş tarihi,
  - özel fiyatlı mağaza ürünleri.

  **Şimdi başlat, süreyi kısalt, uzat ve bitir** butonları var. Kaydedince herkese anında yansır.
- **Arayüz Tasarımcısı (kurucu):** Ana menünün başlığını ve tema rengini seç (Altın / Yakut / Zümrüt / Safir / Ametist), hangi kartların görüneceğini belirle. Hazır bileşenler var: 🖼️ Afiş, 📰 Haber, ⏳ Geri sayım, 🎊 Etkinlik kartı, 🔘 Hızlı butonlar. Canlı önizlemeyle bakıp **Yayınla**.

## ✏️ Kullanıcı adı değiştirme
Profil → Hesap → **Değiştir**. Hesapta **doğrulanmış e-posta** olmalı; yoksa önce eklenip doğrulanması gerekir. Yeni ad için e-postaya 6 haneli kod gelir. Ad 7 günde bir değiştirilebilir.

## 🛡️ Yönetim paneli neler yapabilir? (yetkiye göre)

- Oyuncuları ara; birine tıklayınca yetkine göre işlem penceresi açılır (çevrimiçi olanlar 🟢)
- 🪙 Para ver/al · ⭐ XP ver · 🎁 Eşya ver / tüm botları aç · 🏅 Elo ayarla
- ⚠️ Uyarı gönder (oyuncunun ekranında anında açılır) · 🔇 Sustur · ⛔ Süreli/süresiz ban · ✅ Banı kaldır
- 👢 Sunucudan at · 🔑 Şifre belirle · ✏️ Adını değiştir · 🎖️ Rank ver · ♻️ İlerlemeyi sıfırla · 🗑️ Hesabı sil
- 📢 Tüm oyunculara duyuru gönder
- 🎮 Canlı maçları gör, 👁️ izle veya ✖ kapat
- 📧 E-posta servisi yoksa bekleyen doğrulama ve sıfırlama kodlarını gör

---

## 🛠️ Sorun giderme

| Sorun | Çözüm |
|---|---|
| Logs'ta "MongoDB bağlantısı başarısız" | Şifreyi `<db_password>` yerine doğru yazdın mı? Atlas'ta **Network Access → 0.0.0.0/0** ekli mi? |
| Admin panelinde "Veritabanı: Dosya" | `MONGODB_URI` girilmemiş. Bu durumda hesaplar sunucu yeniden başlayınca silinir! |
| "Sunucuya ulaşılamadı" | Sunucu uyuyor olabilir. 1 dk bekle, **Tekrar dene**. |
| E-posta gelmiyor | Spam klasörü · Brevo'da gönderici doğrulandı mı? · `MAIL_FROM` aynı adres mi? |
| Admin şifresini unuttum | Atlas'ta `users` koleksiyonundan `admin` kaydını sil ve Render'da sunucuyu yeniden başlat. `ADMIN_PASSWORD` ile yeniden oluşur. |

---

## 🎉 Eğlence özellikleri (v3.2)

| Özellik | Nasıl çalışır |
|---|---|
| 🔗 **Arkadaşla Oyna (link)** | Oyna → **Arkadaşla Oyna**. Oda kurulur ve `https://...onrender.com/?room=ABCD` linki panoya kopyalanır. WhatsApp butonu da var. Arkadaşın linke tıklayınca giriş yapıp (veya misafir olarak) doğrudan maça girer. |
| 🔄 **Yeniden bağlanma** | Maç sırasında bağlantı koparsa ya da sayfa yenilenirse **30 saniye** içinde aynı maça otomatik dönülür. Rakip "bağlantı koptu, bekleniyor" mesajı görür. 30 sn geçerse kopan oyuncu kaybetmiş sayılır. |
| 🎬 **Slow-motion K.O.** | Maçı bitiren son taş yavaşlar, kamera o kuyuya yaklaşır, bas vuruşuyla ekran bembeyaz parlar; ardından ZAFER / K.O. yazısı ve konfeti gelir. |
| 🤬 **Masayı Devir** | Kaybedince sonuç penceresinde çıkar: tahta havaya kalkar, taşlar ekrana saçılır. Çevrimiçide rakibe 😡 gider. |
| 🔥 **Kombo & Mega** | Art arda ekstra turlarda "KOMBO x2, x3..." yazısı ve sesi çıkar. 6+ taş alınca ekran sarsılır. Taşlar düşerken her taş bir üst notayı çalar. |
| 📷 **Kamera ile el kontrolü** | Ayarlar → aç. Yumruk yap = kuyudaki taşları al, elini aç = bırak (hamle). Menülerde de aynı hareketle tıklanır. **HTTPS** gerekir (Render adresi HTTPS'tir) ve kamera izni istenir. Görüntü cihazdan çıkmaz; el modeli Google'ın MediaPipe kütüphanesidir. |
| 📺 **Twitch Chat Plays** | Ayarlar → Yayın Modu → kanal adını yaz → Bağlan. Oyna → **Chat'e Karşı**. Sohbet `!kuyu 1`…`!kuyu 6` yazarak oy verir; en çok oy alan kuyu oynanır, kimse oy vermezse yapay zekâ oynar. Twitch'e anonim, salt okunur bağlanılır (şifre gerekmez). Test için ekranda "Test oyu" butonları var. |
| 📱 **Mobil** | Ekran yüksekliği `100dvh` ile kilitli. Kuyuların dokunma alanı genişletildi. Arka plan ve konfeti, ekranın piksel yoğunluğuna göre keskin çiziliyor. |
