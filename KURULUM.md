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
4. **Admin ile giriş:** kullanıcı adı `admin`, şifre `admin`.
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
   | `ADMIN_PASSWORD` | admin için güçlü bir şifre (aşağıdaki güvenlik notunu oku) |

5. **Create Web Service**. Kayıtlarda (Logs) şunları görünce hazırdır:
   ```
   Veritabanı: MongoDB bağlandı ✓
   Mangala sunucusu çalışıyor
   ```
6. Üstteki adres (ör. `https://mangala-online.onrender.com`) artık oyunun! Arkadaşlarına gönder.

> 💡 Kısa yol: **+ New → Blueprint** seçersen `render.yaml` ayarları otomatik doldurur; sadece ortam değişkenlerini girersin.

### 🔐 Admin güvenlik notu (ÖNEMLİ)
- Admin hesabı sunucu **ilk açıldığında** oluşur. Kullanıcı adı `admin`, şifre `ADMIN_PASSWORD` ortam değişkeni; boşsa `admin`.
- Oyun internette herkese açık olacağı için `admin`/`admin` şifresini bırakırsan **herkes admin olup oyuncuları banlayabilir**. Mutlaka ya `ADMIN_PASSWORD` gir ya da ilk girişte **Profil → Şifre Değiştir** ile değiştir.
- Admin hesabının parası sınırsızdır (∞), tüm botlar ve bulmacalar açıktır. Menüde **🛡️ Admin Paneli** görünür.

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
const TOUR_FEE = { 4: 100, 8: 150 };  // çevrimiçi turnuva giriş ücreti
```
Ligler: Bronz (0+), Gümüş (1100+), Altın (1300+), Elmas (1500+), Mangala Ustası (1700+).

---

## 🛡️ Admin paneli neler yapabilir?

- Oyuncuları ara ve listele (çevrimiçi olanlar 🟢)
- 🪙 Para ver / al · ⛔ Süreli ya da süresiz ban (sebep yazılabilir) · ✅ Banı kaldır
- 👢 Sunucudan at · 🔑 Şifre belirle · ♻️ İlerlemeyi sıfırla · ⭐ Admin yap · 🗑️ Hesabı sil
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
