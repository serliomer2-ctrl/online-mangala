/* =========================================================
   OYUN VERİLERİ (katalog, botlar, bulmacalar, başarımlar...)
   name: Türkçe, en: İngilizce
   ========================================================= */
const CAT = {
  boards:{
    klasik: {name:'Klasik Ahşap', en:'Classic Wood', price:0, cls:'', desc:'Geleneksel ıhlamur ağacı', den:'Traditional linden wood'},
    ceviz:  {name:'Koyu Ceviz', en:'Dark Walnut', price:300, cls:'th-ceviz', desc:'Asil ve koyu tonlar', den:'Noble dark tones'},
    yesim:  {name:'Yeşim Bahçe', en:'Jade Garden', price:600, cls:'th-yesim', desc:'Huzur veren yeşil taş', den:'Calming green stone'},
    kiraz:  {name:'Kiraz Lake', en:'Cherry Lacquer', price:900, cls:'th-kiraz', desc:'Parlak kırmızı vernik', den:'Glossy red varnish'},
    mermer: {name:'Beyaz Mermer', en:'White Marble', price:1300, cls:'th-mermer', desc:'Saray salonlarından', den:'From palace halls'},
    gece:   {name:'Gece Mavisi', en:'Midnight Blue', price:1800, cls:'th-gece', desc:'Yıldızlı bir gece', den:'A starry night'},
    altin:  {name:'Sultan Altını', en:'Sultan Gold', price:3000, cls:'th-altin', desc:'Hazinelerin en değerlisi', den:'The most precious treasure'},
    sezon:  {name:'Sezon Tahtası', en:'Season Board', src:'pass', cls:'th-hazan'},
    ejder:  {name:'Ejderha Tahtası', en:'Dragon Board', src:'pass', cls:'th-ejder'},
    turnuva:{name:'Turnuva Tahtası', en:'Tournament Board', src:'event:maraton', cls:'th-turnuva'},
    hazine: {name:'Define Sandığı', en:'Treasure Chest', src:'event:hazine', price:1600, cls:'th-hazine'}
  },
  stones:{
    renkli:{name:'Renkli Cam', en:'Colored Glass', price:0, colors:['#e63946','#f4a261','#2a9d8f','#457b9d','#e9c46a','#9b5de5']},
    deniz: {name:'Deniz Taşı', en:'Sea Pebble', price:200, colors:['#1d7fbf','#48cae4','#0f5e8c','#90e0ef','#2ec4b6']},
    akik:  {name:'Kırmızı Akik', en:'Red Agate', price:450, colors:['#b5172b','#e85d04','#9d0208','#f48c06','#d00000']},
    zumrut:{name:'Zümrüt', en:'Emerald', price:800, colors:['#1b9e5a','#2dc653','#0b6e3b','#7bd389','#38b000']},
    inci:  {name:'İnci', en:'Pearl', price:1200, colors:['#fbf8f3','#f3e6ef','#e9eef6','#fff4e0','#efe9ff']},
    obsid: {name:'Obsidyen', en:'Obsidian', price:1600, colors:['#2b2d42','#3d405b','#22223b','#4a4e69','#1b1b2f']},
    altin: {name:'Altın Sikke', en:'Gold Coin', price:2500, colors:['#ffd166','#f2b705','#e0a100','#ffe08a','#c98c00']},
    kozmik:{name:'Kozmik', en:'Cosmic', price:3500, colors:['#f72585','#7209b7','#4cc9f0','#b5179e','#4361ee','#ffbe0b']},
    sezon: {name:'Sonbahar Yaprağı', en:'Autumn Leaf', src:'pass', colors:['#d9480f','#f08c00','#e8590c','#ffa94d','#a61e4d']},
    ejder: {name:'Ejder Yumurtası', en:'Dragon Egg', src:'pass', colors:['#2b8a3e','#c92a2a','#f59f00','#0b7285','#5c940d']},
    festival:{name:'Festival Şekeri', en:'Festival Candy', src:'event:ciftfest', price:900, colors:['#ff6bcb','#7af0ff','#ffe066','#9b8cff','#7dffa1']}
  },
  hands:{
    klasik: {name:'Klasik El', en:'Classic Hand', price:0, skin:'#f2c9a5',shade:'#c98f62',nail:'#fbe3d6',cuff:'#3b6ea5'},
    bugday: {name:'Buğday Ten', en:'Wheat Skin', price:150, skin:'#d6a06f',shade:'#a8743f',nail:'#f3d2bd',cuff:'#9c3b3b'},
    esmer:  {name:'Esmer Ten', en:'Dark Skin', price:150, skin:'#8d5a3b',shade:'#5f3a22',nail:'#d9b7a2',cuff:'#2e7d4f'},
    eldiven:{name:'Beyaz Eldiven', en:'White Glove', price:600, skin:'#f6f6f6',shade:'#bdbdbd',nail:null,cuff:'#222831'},
    deri:   {name:'Deri Eldiven', en:'Leather Glove', price:900, skin:'#6b3f22',shade:'#3d2210',nail:null,cuff:'#2b2b2b'},
    robot:  {name:'Robot El', en:'Robot Hand', price:1400, skin:'#a3adb9',shade:'#5f6b78',nail:'#4cc9f0',cuff:'#3d4651'},
    altin:  {name:'Altın El', en:'Golden Hand', price:2800, skin:'#f2c14e',shade:'#a8760b',nail:'#fff2b0',cuff:'#7a1b1b'},
    ejder:  {name:'Ejder Pençesi', en:'Dragon Claw', src:'pass', skin:'#3fa34d',shade:'#1f5f2a',nail:'#f1ead0',cuff:'#7a1b1b'},
    mor:    {name:'Mor Eldiven', en:'Purple Glove', src:'event:maraton', price:700, skin:'#8d5bd6',shade:'#5a3296',nail:null,cuff:'#f2c14e'}
  },
  avatars:{
    gulen:{name:'Gülen Yüz',en:'Smiley',price:0,e:'🙂',bg:'#f7d774,#d99a1e'}, havali:{name:'Havalı',en:'Cool',price:200,e:'😎',bg:'#7bd3ff,#2b6cb0'},
    aslan:{name:'Aslan',en:'Lion',price:300,e:'🦁',bg:'#ffcf70,#c4511a'}, kaplan:{name:'Kaplan',en:'Tiger',price:300,e:'🐯',bg:'#ffb36b,#a8460b'},
    panda:{name:'Panda',en:'Panda',price:300,e:'🐼',bg:'#e9ecef,#868e96'}, kurt:{name:'Kurt',en:'Wolf',price:450,e:'🐺',bg:'#adb5bd,#343a40'},
    baykus:{name:'Baykuş',en:'Owl',price:450,e:'🦉',bg:'#d8b98a,#6b4a2b'}, ninja:{name:'Ninja',en:'Ninja',price:700,e:'🥷',bg:'#495057,#141414'},
    buyucu:{name:'Büyücü',en:'Wizard',price:800,e:'🧙',bg:'#b197fc,#5f3dc4'}, robot:{name:'Robot',en:'Robot',price:900,e:'🤖',bg:'#99e9f2,#0b7285'},
    uzayli:{name:'Uzaylı',en:'Alien',price:1100,e:'👽',bg:'#b2f2bb,#2b8a3e'}, kral:{name:'Kral',en:'King',price:1500,e:'🤴',bg:'#ffe066,#e67700'},
    kartal:{name:'Kartal',en:'Eagle',src:'pass',e:'🦅',bg:'#ffd8a8,#d9480f'}, ejder:{name:'Ejderha',en:'Dragon',src:'pass',e:'🐲',bg:'#8ce99a,#c92a2a'},
    sampiyon:{name:'Şampiyon',en:'Champion',src:'pass',e:'🏆',bg:'#fff3bf,#f08c00'}, elmas:{name:'Elmas',en:'Diamond',src:'event:hazine',e:'💎',bg:'#a5d8ff,#1864ab'},
    avci:{name:'Avcı',en:'Hunter',src:'event:efsaneavi',price:800,e:'🏹',bg:'#c0eb75,#2b8a3e'}
  },
  frames:{
    yok:{name:'Çerçevesiz',en:'No Frame',price:0}, bronz:{name:'Bronz',en:'Bronze',price:250}, gumus:{name:'Gümüş',en:'Silver',price:600},
    altin:{name:'Altın',en:'Gold',price:1200}, zumrut:{name:'Zümrüt',en:'Emerald',price:1600}, elmas:{name:'Elmas',en:'Diamond',price:3000},
    sezon:{name:'Sezon',en:'Season',src:'pass'}, ates:{name:'Alev',en:'Flame',src:'pass'}, kraliyet:{name:'Kraliyet',en:'Royal',src:'pass'},
    avci:{name:'Avcı',en:'Hunter',src:'event:efsaneavi'}
  },
  emojis:{
    temel:{name:'Temel',en:'Basic',price:0,anim:'bounce',list:['👋','😀','😮','😢','😡','👍']},
    kutlama:{name:'Kutlama',en:'Party',price:300,anim:'pulse',list:['🎉','🏆','🔥','💪','✨','🥳']},
    hayvan:{name:'Hayvanlar',en:'Animals',price:350,anim:'bounce',list:['🐔','🦊','🐢','🐍','🦉','🐲']},
    kalp:{name:'Sevgi',en:'Love',price:400,anim:'pulse',list:['❤️','🥰','😍','💖','🤗','🙏']},
    sinsi:{name:'Sinsi',en:'Sneaky',price:450,anim:'shake',list:['😏','🤫','🙈','😈','🤡','💤']},
    efsane:{name:'Efsane',en:'Legend',src:'pass',anim:'float',list:['👑','⚡','💎','🌟','🗿','🧠']},
    festival:{name:'Festival',en:'Festival',src:'event:ciftfest',anim:'spin',list:['🎊','🎈','🎆','🪅','🎶','🍬']}
  },
  msgs:{
    temel:{name:'Temel',en:'Basic',price:0,list:['Merhaba! 👋','İyi oyunlar!','Güzel hamle!','Teşekkürler','Hay aksi!','Tekrar oynayalım mı?'],
      len:['Hello! 👋','Good game!','Nice move!','Thanks','Oops!','Play again?']},
    kibar:{name:'Kibar',en:'Polite',price:250,list:['Harika oynuyorsun','Bol şans!','Saygılar 🙏','Bu çok zekiceydi','Keyifli bir oyun'],
      len:['You play great','Good luck!','Respect 🙏','That was clever','Fun game']},
    rekabet:{name:'Rekabet',en:'Rivalry',price:350,list:['Şimdi görürsün!','Bu daha başlangıç','Hazinem doluyor 😎','Çift kuralı geliyor!','Sıra bende!'],
      len:['Watch this!','Just getting started','My store is filling 😎','Even rule incoming!','My turn!']},
    komik:{name:'Komik',en:'Funny',price:400,list:['Taşlarım nereye gitti? 😅','Bunu planlamıştım... sanırım','Elim kaydı!','Kahve molası ☕','Düşünüyorum... 🤔'],
      len:['Where did my stones go? 😅','I planned that... I think','My hand slipped!','Coffee break ☕','Thinking... 🤔']},
    sampiyon:{name:'Şampiyon',en:'Champion',src:'pass',list:['Şampiyon geldi 🏆','Tahtanın efendisi benim','Hazinem taşıyor!','Bir efsane doğuyor'],
      len:['The champ is here 🏆','I rule this board','My store overflows!','A legend is born']}
  }
};
const CAT_INFO = {
  featured:{name:'⭐ Öne Çıkanlar',en:'⭐ Featured'}, boards:{name:'🟫 Tahtalar',en:'🟫 Boards',eq:'board'}, stones:{name:'🔴 Taşlar',en:'🔴 Stones',eq:'stone'},
  hands:{name:'✋ Eller',en:'✋ Hands',eq:'hand'}, avatars:{name:'🙂 Avatarlar',en:'🙂 Avatars',eq:'avatar'}, frames:{name:'⭕ Çerçeveler',en:'⭕ Frames',eq:'frame'},
  emojis:{name:'😀 Emojiler',en:'😀 Emojis'}, msgs:{name:'💬 Mesajlar',en:'💬 Messages'},
  bgs:{name:'🌌 Arka Planlar',en:'🌌 Backgrounds',eq:'bg'}, wins:{name:'🎆 Zafer Efektleri',en:'🎆 Victory FX',eq:'win'}
};
CAT.bgs = {
  yok:       {name:'Sıcak Işık',en:'Warm Glow',price:0,icon:'✨',desc:'Süzülen sıcak ışık zerreleri',den:'Floating warm light motes'},
  kar:       {name:'Kar Yağışı',en:'Snowfall',price:400,icon:'❄️',desc:'Sakin bir kış akşamı',den:'A calm winter evening'},
  yaprak:    {name:'Sonbahar',en:'Autumn',price:600,icon:'🍂',desc:'Dans eden turuncu yapraklar',den:'Dancing orange leaves'},
  kiraz:     {name:'Kiraz Çiçeği',en:'Sakura',price:900,icon:'🌸',desc:'Rüzgârda savrulan pembe yapraklar',den:'Pink petals in the wind'},
  atesbocegi:{name:'Ateş Böcekleri',en:'Fireflies',price:1200,icon:'🟡',desc:'Yaz gecesinde yanıp sönen ışıklar',den:'Blinking lights of a summer night'},
  yildiz:    {name:'Yıldızlı Gece',en:'Starry Night',price:1500,icon:'⭐',desc:'Göz kırpan yıldızlar ve kayan yıldız',den:'Twinkling stars and shooting stars'},
  deniz:     {name:'Deniz Altı',en:'Under the Sea',price:1800,icon:'🫧',desc:'Yükselen kabarcıklar',den:'Rising bubbles'},
  hazine:    {name:'Hazine Yağmuru',en:'Treasure Rain',price:3000,icon:'🪙',desc:'Gökten altın yağar',den:'Gold falls from the sky'}
};
CAT.wins = {
  klasik:{name:'Konfeti',en:'Confetti',price:0,icon:'🎊',desc:'Rengârenk klasik konfeti',den:'Classic colorful confetti'},
  kalp:  {name:'Kalpler',en:'Hearts',price:700,icon:'💖',desc:'Sevgi dolu bir zafer',den:'A victory full of love'},
  havai: {name:'Havai Fişek',en:'Fireworks',price:900,icon:'🎆',desc:'Gökyüzünde patlayan renkler',den:'Colors bursting in the sky'},
  altin: {name:'Altın Yağmuru',en:'Gold Rain',price:1200,icon:'🪙',desc:'Ekrana altın yağar',den:'Gold rains on the screen'},
  yildiz:{name:'Yıldız Patlaması',en:'Star Burst',price:1500,icon:'🌟',desc:'Ortadan fışkıran yıldızlar',den:'Stars bursting from the center'},
  ejder: {name:'Ejderha Nefesi',en:'Dragon Breath',price:2500,icon:'🐉',desc:'Bir ejderha ekranı ateşe verir!',den:'A dragon sets the screen on fire!'}
};
const BOTS = [
  {id:'kolay', name:'Çırak', en:'Apprentice', emoji:'🐣', bg:'#b2f2bb,#2b8a3e', hand:'bugday', lvl:'Kolay', len:'Easy', color:'#4cc38a', stars:1, price:0, reward:50,
   desc:'Kuralları yeni öğrendi; çoğu zaman rastgele oynar.', den:'Just learned the rules; plays mostly at random.', ai:{easy:true}},
  {id:'orta', name:'Kalfa', en:'Journeyman', emoji:'🦊', bg:'#ffd8a8,#d9480f', hand:'esmer', lvl:'Orta', len:'Medium', color:'#5aa9e6', stars:2, price:250, reward:100,
   desc:'Bir sonraki hamleyi hesaplar, açık taşları kaçırmaz.', den:'Calculates the next move and never misses a free capture.', ai:{depth:2}},
  {id:'zor', name:'Usta', en:'Master', emoji:'🦉', bg:'#d8b98a,#6b4a2b', hand:'eldiven', lvl:'Zor', len:'Hard', color:'#f2c14e', stars:3, price:600, reward:200,
   desc:'Birkaç hamle ilerisini düşünür, tuzak kurar.', den:'Thinks several moves ahead and sets traps.', ai:{depth:4}},
  {id:'cokzor', name:'Üstat', en:'Grandmaster', emoji:'🐺', bg:'#adb5bd,#343a40', hand:'robot', lvl:'Çok Zor', len:'Very Hard', color:'#f08c3a', stars:4, price:1200, reward:350,
   desc:'Derin hesap yapar; hatalarını hemen cezalandırır.', den:'Calculates deeply and punishes every mistake.', ai:{depth:9}},
  {id:'efsane', name:'Efsane', en:'Legend', emoji:'🐉', bg:'#8ce99a,#c92a2a', hand:'ejder', lvl:'Efsane', len:'Legend', color:'#e5534b', stars:5, price:2500, reward:600,
   desc:'Yenilmesi neredeyse imkânsız. Gerçek bir şampiyon ol!', den:'Nearly unbeatable. Become a true champion!', ai:{depth:16, time:1400}}
];
const MODES = {
  classic:{name:'Klasik',en:'Classic',icon:'🪵',desc:'Geleneksel Mangala kuralları.',den:'Traditional Mangala rules.'},
  blitz:{name:'Yıldırım',en:'Blitz',icon:'⚡',desc:'Her hamle için sadece 8 saniye! Süre biterse rastgele hamle yapılır.',den:'Only 8 seconds per move! Time out = random move.'},
  reverse:{name:'Ters Mangala',en:'Reverse',icon:'🔄',desc:'En AZ taş toplayan kazanır! Rakibe taş doldurmaya çalış.',den:'FEWEST stones wins! Try to stuff your opponent.'},
  mystery:{name:'Gizemli Kuyu',en:'Mystery Pit',icon:'❓',desc:'❓ işaretli kuyudan alınan taşlar 2 kat sayılır. Son taşı oraya düşürürsen +2 puan ve kuyu yer değiştirir.',den:'Stones captured from the ❓ pit count double. Land your last stone there for +2 and the pit moves.'},
  mini:{name:'Mini Mangala',en:'Mini Mangala',icon:'🌱',desc:'Her kuyuda 3 taş: hızlı, kısa ve keskin maçlar.',den:'3 stones per pit: quick, short, sharp games.'},
  dev:{name:'Dev Mangala',en:'Giant Mangala',icon:'🏔️',desc:'Her kuyuda 6 taş: uzun, taktik dolu dev maçlar.',den:'6 stones per pit: long games full of tactics.'},
  cards:{name:'Süper Güçler',en:'Power Cards',icon:'🃏',desc:'Her oyuncunun 3 kartı var, her biri maçta 1 kez: ❄️ Dondur, 🔀 Takas, 🛡️ Kalkan.',den:'Each player has 3 one-time cards: ❄️ Freeze, 🔀 Swap, 🛡️ Shield.'}
};
const CARDS = {
  freeze:{icon:'❄️',name:'Dondur',en:'Freeze',desc:'Rakibin bir kuyusunu bir tur kilitler.',den:"Locks one of your opponent's pits for a turn."},
  swap:{icon:'🔀',name:'Takas',en:'Swap',desc:'Kendi iki komşu kuyunun taşlarını yer değiştirir.',den:'Swaps the stones of two of your neighbouring pits.'},
  shield:{icon:'🛡️',name:'Kalkan',en:'Shield',desc:'Rakibin bir sonraki turunda kuyuların taş kaptırmaz.',den:"Your pits can't be captured during your opponent's next turn."}
};
const LEAGUES = [
  {id:'bronz',name:'Bronz',en:'Bronze',min:0,icon:'🥉',color:'#cd7f32'},{id:'gumus',name:'Gümüş',en:'Silver',min:1100,icon:'🥈',color:'#c0c8d0'},
  {id:'altin',name:'Altın',en:'Gold',min:1300,icon:'🥇',color:'#f2c14e'},{id:'elmas',name:'Elmas',en:'Diamond',min:1500,icon:'💎',color:'#7bd3ff'},
  {id:'usta',name:'Mangala Ustası',en:'Mangala Master',min:1700,icon:'👑',color:'#e5534b'}
];
const ACHS = [
  {id:'gunluk7',icon:'📅',name:'Her Gün Bir Bulmaca',en:'Puzzle a Day',desc:'Günün Bulmacası\'nı 7 gün üst üste çöz.',den:'Solve the Daily Puzzle 7 days in a row.',reward:400},
  {id:'yanyana',icon:'👫',name:'Masa Başı',en:'Tabletop',desc:'Yan Yana modunda bir maç bitir.',den:'Finish a Side by Side match.',reward:80},
  {id:'geri_almadan',icon:'💪',name:'Yardımsız',en:'Unassisted',desc:'Usta veya Efsane botu Geri Al/İpucu kullanmadan yen.',den:'Beat the Master or Legend bot without Undo/Hint.',reward:300},
  {id:'ilk_zafer',icon:'🥇',name:'İlk Zafer',en:'First Victory',desc:'İlk oyununu kazan.',den:'Win your first game.',reward:100},
  {id:'hazine_canavari',icon:'💰',name:'Hazine Canavarı',en:'Treasure Monster',desc:'Tek turda hazinene 10+ taş sok.',den:'Put 10+ stones in your store in one turn.',reward:200,title:'kuyu_efendisi'},
  {id:'tertemiz',icon:'🧹',name:'Tertemiz Süpürme',en:'Clean Sweep',desc:'Rakibin bölgesini tek hamlede tamamen boşalt.',den:"Empty your opponent's whole side in one move.",reward:250,title:'supurgeci'},
  {id:'clutch',icon:'⏱️',name:'Son Saniye',en:'Last-Second Clutch',desc:'Rakip öndeyken son 3 hamlende maçı çevir.',den:'Turn the game around in your last 3 moves while behind.',reward:300,title:'taktik_dehasi'},
  {id:'ezici',icon:'💪',name:'Ezici Zafer',en:'Crushing Win',desc:'36 veya daha fazla taşla kazan.',den:'Win with 36 or more stones.',reward:150},
  {id:'efsane_avcisi',icon:'🐉',name:'Efsane Avcısı',en:'Legend Slayer',desc:'Efsane botu yen.',den:'Beat the Legend bot.',reward:500,title:'efsane_avcisi'},
  {id:'tum_botlar',icon:'🤖',name:'Bot Terminatörü',en:'Bot Terminator',desc:'Bütün botları en az bir kez yen.',den:'Beat every bot at least once.',reward:400},
  {id:'yildirim',icon:'⚡',name:'Yıldırım',en:'Lightning',desc:'Yıldırım modunda bir oyun kazan.',den:'Win a Blitz game.',reward:150,title:'yildirim'},
  {id:'kaos',icon:'🌀',name:'Kaos Kralı',en:'King of Chaos',desc:'Bir parti modunda kazan (Ters, Gizemli, Kartlar).',den:'Win a party mode game.',reward:150,title:'kaos_krali'},
  {id:'ters_dahi',icon:'🔄',name:'Ters Köşe',en:'Upside Down',desc:'Ters Mangala modunda kazan.',den:'Win a Reverse game.',reward:150,title:'ters_kose'},
  {id:'online_zafer',icon:'🌍',name:'Dünya Sahnesi',en:'World Stage',desc:'Çevrimiçi bir oyun kazan.',den:'Win an online game.',reward:200},
  {id:'seri5',icon:'🔥',name:'Alev Alev',en:'On Fire',desc:'Art arda 5 oyun kazan.',den:'Win 5 games in a row.',reward:300},
  {id:'cift50',icon:'✌️',name:'Çift Ustası',en:'Even Master',desc:'Çift sayı kuralıyla toplam 50 kez taş al.',den:'Capture 50 times with the even rule.',reward:250},
  {id:'bulmaca5',icon:'🧩',name:'Bulmaca Sever',en:'Puzzle Lover',desc:'5 bulmaca çöz.',den:'Solve 5 puzzles.',reward:150},
  {id:'bulmaca_hepsi',icon:'🧠',name:'Hesap Makinesi',en:'Calculator',desc:'Bütün bulmacaları çöz.',den:'Solve every puzzle.',reward:600,title:'hesap_makinesi'},
  {id:'altin_lig',icon:'🥇',name:'Altın Kol',en:'Golden Arm',desc:'Dereceli Altın lige ulaş.',den:'Reach Gold league in ranked.',reward:400,title:'altin_kol'},
  {id:'usta_lig',icon:'👑',name:'Mangala Ustası',en:'Mangala Master',desc:'Dereceli en üst lige ulaş.',den:'Reach the top ranked league.',reward:1000,title:'mangala_ustasi'},
  {id:'turnuva',icon:'🏆',name:'Turnuva Şampiyonu',en:'Tournament Champion',desc:'Bir turnuva kazan.',den:'Win a tournament.',reward:400,title:'sampiyon'},
  {id:'koleksiyon',icon:'🎒',name:'Koleksiyoncu',en:'Collector',desc:'25 eşyaya sahip ol.',den:'Own 25 items.',reward:300,title:'koleksiyoncu'},
  {id:'maraton',icon:'🏃',name:'Maratoncu',en:'Marathoner',desc:'100 oyun oyna.',den:'Play 100 games.',reward:500,title:'maratoncu'},
  {id:'kombo3',icon:'🔥',name:'Kombo Kralı',en:'Combo King',desc:'Art arda 3 ekstra tur yap.',den:'Chain 3 extra turns in a row.',reward:200,title:'kombo_krali'},
  {id:'masa_devir',icon:'🤬',name:'Masa Devirici',en:'Table Flipper',desc:'Kaybedince masayı devir.',den:'Flip the table after a loss.',reward:50,title:'masa_devirici'},
  {id:'chat_yendi',icon:'📺',name:'Sohbeti Yendim',en:'Beat the Chat',desc:'Twitch sohbetine karşı kazan.',den:'Beat your Twitch chat.',reward:300,title:'yayinci'},
  {id:'kamera_zafer',icon:'📷',name:'Jedi Ustası',en:'Jedi Master',desc:'Kamera ile el kontrolünü kullanarak kazan.',den:'Win using camera hand control.',reward:300,title:'jedi'},
  {id:'sezon30',icon:'🎫',name:'Sezon Efsanesi',en:'Season Legend',desc:'Sezon Kartında 30. kademeye ulaş.',den:'Reach tier 30 of the Season Pass.',reward:500}
];
const TITLES = {
  caylak:{name:'Çaylak',en:'Rookie'}, kuyu_efendisi:{name:'Kuyu Efendisi',en:'Lord of the Pits'}, supurgeci:{name:'Süpürgeci',en:'The Sweeper'},
  taktik_dehasi:{name:'Taktik Dehası',en:'Tactical Genius'}, efsane_avcisi:{name:'Efsane Avcısı',en:'Legend Slayer'}, yildirim:{name:'Yıldırım Hızında',en:'Lightning Fast'},
  kaos_krali:{name:'Kaos Kralı',en:'King of Chaos'}, ters_kose:{name:'Ters Köşe',en:'Upside Down'}, hesap_makinesi:{name:'Hesap Makinesi',en:'The Calculator'},
  altin_kol:{name:'Altın Kol',en:'Golden Arm'}, mangala_ustasi:{name:'Mangala Ustası',en:'Mangala Master'}, sampiyon:{name:'Turnuva Şampiyonu',en:'Tournament Champion'},
  koleksiyoncu:{name:'Koleksiyoncu',en:'Collector'}, kombo_krali:{name:'Kombo Kralı',en:'Combo King'}, masa_devirici:{name:'Masa Devirici',en:'Table Flipper'},
  yayinci:{name:'Yayın Yıldızı',en:'Stream Star'}, jedi:{name:'Jedi Ustası',en:'Jedi Master'}, maratoncu:{name:'Maratoncu',en:'Marathoner'}
};
const PUZZLE_TEXT = {
  even:{tr:'Tek turda <b>çift sayı kuralıyla</b> en az <b>{0} taş</b> kap.',en:'Capture at least <b>{0} stones</b> with the <b>even rule</b> in one turn.'},
  empty:{tr:'Tek turda <b>boş kuyu kuralıyla</b> en az <b>{0} taş</b> kap.',en:'Capture at least <b>{0} stones</b> with the <b>empty pit rule</b> in one turn.'},
  chain:{tr:'Art arda <b>{0} kez ekstra tur</b> kazan (son taşı hazinene düşür).',en:'Earn <b>{0} extra turns</b> in a row (land your last stone in your store).'},
  gain:{tr:'Tek turda hazinene en az <b>{0} taş</b> ekle.',en:'Add at least <b>{0} stones</b> to your store in one turn.'}
};
// Bilgisayarla üretildi ve doğrulandı: her birinin tek bir doğru ilk hamlesi var
const PUZZLES = [
  {"type":"even","target":4,"board":[0,1,2,0,8,5,9,6,1,0,2,3,0,11],"sol":[4]},
  {"type":"even","target":6,"board":[2,6,0,1,3,6,8,0,1,5,5,2,1,8],"sol":[5]},
  {"type":"even","target":8,"board":[7,5,1,1,1,4,12,0,7,1,1,3,2,3],"sol":[5]},
  {"type":"empty","target":7,"board":[1,5,4,1,0,0,11,0,6,5,1,2,3,9],"sol":[3]},
  {"type":"even","target":4,"board":[0,1,2,1,3,7,3,6,5,1,1,2,3,13],"sol":[4,5]},
  {"type":"even","target":4,"board":[2,2,2,1,3,3,11,2,3,3,1,3,1,11],"sol":[4,5]},
  {"type":"empty","target":7,"board":[2,0,7,3,0,1,13,6,0,3,1,0,1,11],"sol":[5,3]},
  {"type":"empty","target":7,"board":[4,4,4,1,2,1,4,6,1,6,1,7,6,1],"sol":[5,2]},
  {"type":"gain","target":7,"board":[6,0,1,6,6,1,3,5,1,6,1,2,2,8],"sol":[5,0]},
  {"type":"gain","target":8,"board":[4,4,0,1,1,1,9,6,6,1,0,5,5,5],"sol":[5,4]},
  {"type":"gain","target":8,"board":[2,0,6,6,5,1,7,5,2,0,5,0,6,3],"sol":[5,2]},
  {"type":"gain","target":9,"board":[1,0,1,1,1,1,10,7,2,7,1,1,4,11],"sol":[5,4]},
  {"type":"empty","target":6,"board":[5,5,0,2,6,2,2,5,1,6,5,5,1,3],"sol":[5,5,1]},
  {"type":"gain","target":8,"board":[5,5,0,2,6,2,2,5,1,6,5,5,1,3],"sol":[5,5,1]},
  {"type":"chain","target":2,"board":[1,1,0,1,2,2,14,2,1,1,1,1,1,20],"sol":[5,5,0]},
  {"type":"chain","target":2,"board":[0,1,1,5,1,2,26,0,0,1,2,1,0,8],"sol":[5,5,1]},
  {"type":"chain","target":2,"board":[6,2,7,1,3,0,13,0,1,0,7,1,1,6],"sol":[4,5,0]},
  {"type":"chain","target":2,"board":[1,0,0,1,1,2,23,0,1,1,3,0,2,13],"sol":[5,5,0]},
  {"type":"chain","target":2,"board":[0,2,0,2,0,2,13,1,3,1,1,2,0,21],"sol":[5,5,1]},
  {"type":"chain","target":4,"board":[0,1,1,1,3,2,19,0,0,0,1,5,1,14],"sol":[5,4,5,5,1]}
];

const PASS_TIERS=30, PASS_XP=300, PASS_PRICE=1500;
const SEASON_NAMES={tr:['Ayaz','Kardelen','Nevruz','Lale','Bahar','Güneş','Deniz','Hasat','Bağbozumu','Hazan','Sis','Kış Masalı'],
  en:['Frost','Snowdrop','Nowruz','Tulip','Spring','Sun','Sea','Harvest','Vintage','Autumn','Mist','Winter Tale']};
const PASS_FREE_ITEMS={5:['avatars','kartal'],10:['frames','sezon'],15:['stones','sezon'],20:{coins:300},25:['hands','eldiven'],30:['boards','sezon']};
const PASS_PREM_ITEMS={1:['avatars','ejder'],4:['emojis','efsane'],8:['frames','ates'],12:['msgs','sampiyon'],16:['hands','ejder'],20:['boards','ejder'],24:['frames','kraliyet'],27:['stones','ejder'],30:['avatars','sampiyon']};
const EVENTS=[
  {id:'ciftfest',name:'Çift Kuralı Festivali',en:'Even Rule Festival',icon:'🎊',desc:'Çift sayı kuralıyla taş al! Bu hafta her çift alım <b>+5 🪙</b> bonus.',den:'Capture with the even rule! Each even capture gives <b>+5 🪙</b> this week.',metric:'even',goal:15,reward:{coins:300,item:['emojis','festival']},shop:[['stones','festival']]},
  {id:'hazine',name:'Hazine Haftası',en:'Treasure Week',icon:'💰',desc:'Bu hafta tüm oyunlardan <b>2 KAT</b> para kazanırsın!',den:'Earn <b>DOUBLE</b> coins from every game this week!',metric:'win',goal:5,reward:{coins:250,item:['avatars','elmas']},shop:[['boards','hazine']]},
  {id:'efsaneavi',name:'Efsane Avı',en:'Legend Hunt',icon:'🏹',desc:'Usta veya daha zor botları ya da çevrimiçi oyuncuları yen.',den:'Beat Master-or-harder bots or online players.',metric:'hardwin',goal:3,reward:{coins:500,item:['frames','avci']},shop:[['avatars','avci']]},
  {id:'maraton',name:'Mangala Maratonu',en:'Mangala Marathon',icon:'🏃',desc:'Bol bol oyna! Çevrimiçi oyunlar <b>2 kat</b> sayılır.',den:'Play a lot! Online games count <b>double</b>.',metric:'play',extra:'onlineplay',goal:10,reward:{coins:300,item:['boards','turnuva']},shop:[['hands','mor']]}
];
const QUESTS=[
  {id:'win1',txt:'1 oyun kazan',en:'Win 1 game',metric:'win',goal:1},{id:'win2',txt:'2 oyun kazan',en:'Win 2 games',metric:'win',goal:2},
  {id:'play3',txt:'3 oyun oyna',en:'Play 3 games',metric:'play',goal:3},{id:'even3',txt:'Çift sayı kuralıyla 3 kez taş al',en:'Capture 3 times with the even rule',metric:'even',goal:3},
  {id:'empty2',txt:'Boş kuyu kuralıyla 2 kez taş al',en:'Capture 2 times with the empty pit rule',metric:'empty',goal:2},
  {id:'extra4',txt:'4 kez ekstra hamle kazan',en:'Earn 4 extra turns',metric:'extra',goal:4},
  {id:'big25',txt:'Hazinende 25+ taşla oyun bitir',en:'Finish a game with 25+ stones',metric:'big',goal:1},
  {id:'emote3',txt:'Oyunda 3 emoji veya mesaj gönder',en:'Send 3 emojis or messages in game',metric:'emote',goal:3},
  {id:'puzzle1',txt:'1 bulmaca çöz',en:'Solve 1 puzzle',metric:'puzzle',goal:1},
  {id:'blitz1',txt:'1 yıldırım oyunu oyna',en:'Play 1 blitz game',metric:'blitz',goal:1},
  {id:'party1',txt:'1 parti modu oyunu oyna',en:'Play 1 party mode game',metric:'party',goal:1}
];
const QUEST_REWARD={coins:80,xp:100};
const LOGIN_REWARDS=[50,75,100,150,200,250,500];
const TUT_BONUS=150;
const ONLINE_REWARD={win:150,draw:75,loss:20};

/* ---------- Eğitim (TR + EN). [[...]] yer tutucuları tahta düzenine göre değişir ---------- */
const ORDER={0:1,1:2,2:3,3:4,4:5,5:6,6:7,7:8,8:9,9:10,10:11,11:12,12:13};
const TUT=[
 {t:'Mangala\'ya Hoş Geldin! 👋', te:'Welcome to Mangala! 👋', board:'INIT',
  x:'Mangala, Orta Asya\'dan Anadolu\'ya uzanan, binlerce yıllık bir <b>Türk zekâ ve strateji oyunudur</b>. İki kişiyle oynanır.<br><br>Bu eğitimde oyunun <b>bütün kurallarını</b> adım adım ve <b>oynayarak</b> öğreneceksin. Eğitim zorunludur ve yalnızca bir kez oynanır. Sonunda <b>'+TUT_BONUS+' 🪙</b> ödül kazanacaksın!',
  xe:'Mangala is a thousands-of-years-old <b>Turkish strategy game</b> from Central Asia and Anatolia, played by two people.<br><br>In this tutorial you will learn <b>all the rules</b> step by step, <b>by playing</b>. The tutorial is mandatory and played only once. You will earn <b>'+TUT_BONUS+' 🪙</b> at the end!'},
 {t:'Oyun Tahtası', te:'The Board', hl:[0,1,2,3,4,5],
  x:'Tahtada <b>12 küçük kuyu</b> vardır. <b>[[me]] 6 kuyu SENİN</b> (parlayanlar), diğer 6 kuyu rakibinin.<br>Her oyuncu yalnızca <b>kendi tarafındaki</b> kuyulardan oynayabilir.',
  xe:'The board has <b>12 small pits</b>. <b>The [[me_en]] 6 pits are YOURS</b> (glowing); the other 6 belong to your opponent.<br>You may only play from pits <b>on your side</b>.'},
 {t:'Hazineler', te:'The Stores', hl:[6,13],
  x:'İki uçtaki büyük çukurlara <b>hazine</b> denir. <b>[[mestore]] senin hazinen</b>, [[oppstore]] rakibinin hazinesidir.<br><br>🎯 Oyunun amacı: <b>Hazinende rakibinden daha çok taş toplamak.</b>',
  xe:'The large pits at both ends are called <b>stores</b>. <b>The [[mestore_en]] one is yours</b>, the [[oppstore_en]] one is your opponent\'s.<br><br>🎯 Goal: <b>collect more stones in your store than your opponent.</b>'},
 {t:'Başlangıç Dizilişi', te:'Setup', board:'INIT',
  x:'Oyun başında <b>her kuyuya 4 taş</b> konur: 12 kuyu × 4 taş = <b>48 taş</b>. Hazineler boş başlar.<br><br>İlk hamleyi kimin yapacağı <b>kura</b> ile belirlenir.',
  xe:'At the start <b>each pit holds 4 stones</b>: 12 pits × 4 = <b>48 stones</b>. The stores start empty.<br><br>Who moves first is decided by a <b>coin toss</b>.'},
 {t:'Dağıtma Yönü ↻', te:'Sowing Direction ↻', order:true, dim:[13],
  x:'Taşlar her zaman <b>saat yönünün tersine</b> dağıtılır: [[dir]]... Mavi numaralar taşların izlediği yolu gösterir.<br><br>Dikkat: <b>Rakibin hazinesinde numara yok</b> — oraya hiç taş koymazsın!',
  xe:'Stones always travel <b>counter-clockwise</b>: [[dir_en]]... The blue numbers show the path.<br><br>Note: <b>your opponent\'s store has no number</b> — you never drop stones there!'},
 {type:'move', t:'İlk Hamlen: Taş Dağıtma', te:'Your First Move: Sowing', board:'INIT', pit:0,
  x:'Kendi kuyularından birini seçer, içindeki <b>TÜM taşları</b> eline alırsın.<br>📌 <b>İlk taşı aldığın kuyuya geri bırakırsın</b>, kalanları <b>birer birer</b> dağıtırsın.<br><br>👆 Parlayan [[first]] kuyuna dokun ve elini izle!',
  xe:'Choose one of your pits and pick up <b>ALL its stones</b>.<br>📌 <b>Drop the first stone back into the same pit</b>, then sow the rest <b>one by one</b>.<br><br>👆 Tap your glowing [[first_en]] pit and watch your hand!',
  after:'Harika! Elin 4 taşı aldı; <b>ilki aynı kuyuya</b> düştü, kalan 3 taş sıradaki kuyulara birer birer bırakıldı. Şimdi sıra rakipte.',
  afe:'Great! Your hand picked up 4 stones; <b>the first went back into the same pit</b> and the other 3 were sown one by one. Now it\'s your opponent\'s turn.'},
 {t:'Hangi Kuyuları Oynayabilirsin?', te:'Which Pits Can You Play?', hl:[0,1,2,3,4,5],
  x:'✅ Sadece <b>kendi tarafındaki</b> ve <b>içinde taş olan</b> kuyuları oynayabilirsin.<br>❌ Boş kuyu veya rakibin kuyusu seçilemez.<br>🔁 Normalde her hamleden sonra <b>sıra rakibe geçer</b>. Ama bunun bir istisnası var!',
  xe:'✅ You can only play pits <b>on your side</b> that <b>contain stones</b>.<br>❌ Empty pits and opponent pits can\'t be chosen.<br>🔁 Normally the <b>turn passes to your opponent</b> after each move. But there is an exception!'},
 {type:'move', t:'Tek Taş Kuralı', te:'Single Stone Rule', board:[3,4,1,2,5,4,2, 4,3,5,4,2,4,5], pit:2,
  x:'Bir kuyuda <b>yalnızca 1 taş</b> varsa, o taş aynı kuyuda kalmaz; <b>doğrudan sıradaki kuyuya geçer</b>.<br><br>👆 İçinde tek taş olan parlayan kuyuna dokun.',
  xe:'If a pit has <b>only 1 stone</b>, it does not stay; it <b>moves straight to the next pit</b>.<br><br>👆 Tap your glowing pit with a single stone.',
  after:'Gördün mü? Tek taş <b>yan kuyuya geçti</b> ve aldığın kuyu boş kaldı.', afe:'See? The single stone <b>moved to the next pit</b> and the pit you took from is empty.'},
 {type:'move', t:'Hazine Kuralı: Tekrar Oyna! ⭐', te:'Store Rule: Play Again! ⭐', board:[2,3,5,1,2,4,3, 4,4,3,5,4,3,5], pit:2,
  x:'Elindeki <b>SON taş kendi hazinene</b> düşerse, <b>bir kez daha oynama hakkı</b> kazanırsın!<br><br>👆 5 taşlı parlayan kuyuna dokun ve son taşın nereye düştüğünü izle.',
  xe:'If your <b>LAST stone lands in your own store</b>, you get <b>another turn</b>!<br><br>👆 Tap your glowing pit with 5 stones and watch where the last one lands.',
  after:'Son taş <b>hazinene</b> düştü: <b>TEKRAR SENİN SIRAN!</b> 🎉', afe:'The last stone landed in <b>your store</b>: <b>YOUR TURN AGAIN!</b> 🎉'},
 {type:'move', t:'Rakibin Hazinesi Atlanır', te:"Skip the Opponent's Store", board:[1,2,2,1,12,0,4, 3,2,4,3,2,3,9], pit:4,
  x:'Çok taşlı bir kuyu tüm tahtayı dolaşabilir. Ama <b>rakibinin hazinesine ASLA taş koyulmaz</b>; o hazine <b>atlanır</b>.<br><br>👆 12 taşlı kuyuna dokun ve rakibin hazinesini izle.',
  xe:'A big pit can travel around the whole board. But <b>you NEVER drop a stone in your opponent\'s store</b>; it is <b>skipped</b>.<br><br>👆 Tap your pit with 12 stones and watch your opponent\'s store.',
  after:'Elin tahtayı dolaştı ama <b>rakibin hazinesine hiç taş bırakmadı</b>. Kendi hazinene ise taş koyulur.', afe:'Your hand went all the way round but <b>left nothing in your opponent\'s store</b>. Your own store does get stones.'},
 {type:'move', t:'Çift Sayı Kuralı 💰', te:'Even Number Rule 💰', board:[2,3,1,4,2,3,5, 3,2,4,3,1,2,13], pit:5,
  x:'Son taşın <b>rakibinin bir kuyusuna</b> düşer ve oradaki taş sayısını <b>ÇİFT</b> yaparsa (2, 4, 6...), o kuyudaki <b>bütün taşları kazanırsın!</b><br><br>Rakibinin [[opp7]] kuyusunda 3 taş var. 👆 Parlayan kuyuna dokun.',
  xe:'If your last stone lands in <b>an opponent\'s pit</b> and makes it <b>EVEN</b> (2, 4, 6...), you <b>win all the stones in that pit!</b><br><br>Your opponent\'s [[opp7_en]] pit has 3 stones. 👆 Tap your glowing pit.',
  after:'3 + 1 = <b>4 (çift)!</b> Elin o kuyudaki 4 taşı <b>senin hazinene</b> taşıdı. 💰', afe:'3 + 1 = <b>4 (even)!</b> Your hand carried all 4 stones to <b>your store</b>. 💰'},
 {type:'quiz', t:'Peki Tek Olursa?', te:'What If It\'s Odd?', q:'Son taşın rakibin kuyusuna düştü ve oradaki taş sayısı <b>5</b> oldu. Ne olur?', qe:'Your last stone landed in an opponent pit, which now has <b>5</b> stones. What happens?',
  opts:['O 5 taşın hepsini alırım','Hiçbir şey olmaz, sıra rakibe geçer','Bir kez daha oynarım'], oe:['I take all 5 stones','Nothing, the turn passes','I play again'], a:1,
  ok:'Doğru! Sayı <b>tek</b> olursa taş alınmaz; sıra rakibe geçer.', oke:'Correct! If it\'s <b>odd</b>, nothing is captured; the turn passes.',
  no:'İpucu: Taş almak için sayının ÇİFT olması gerekir.', noe:'Hint: the number must be EVEN to capture.'},
 {type:'move', t:'Boş Kuyu Kuralı 🎯', te:'Empty Pit Rule 🎯', board:[3,2,0,4,1,2,6, 3,4,2,5,3,2,11], pit:1,
  x:'Son taşın <b>kendi tarafındaki BOŞ bir kuyuya</b> düşerse ve <b>tam karşısındaki rakip kuyusunda taş varsa</b>: o son taşı <b>ve</b> karşıdaki bütün taşları hazinene alırsın!<br><br>Üçüncü kuyun boş, karşısında 5 taş var. 👆 2 taşlı parlayan kuyuna dokun.',
  xe:'If your last stone lands in <b>an EMPTY pit on your side</b> and the <b>opposite opponent pit has stones</b>, you take that stone <b>and</b> all the opposite stones!<br><br>Your third pit is empty with 5 stones opposite. 👆 Tap your glowing pit with 2 stones.',
  after:'Son taş <b>boş kuyuna</b> düştü. Karşıdaki <b>5 taş + kendi taşın = 6 taş</b> hazinene geçti! 🎯', afe:'Your last stone hit an <b>empty pit</b>. <b>5 opposite + your 1 = 6 stones</b> went to your store! 🎯'},
 {type:'quiz', t:'Karşı Kuyu da Boşsa?', te:'Opposite Pit Empty Too?', q:'Son taşın kendi <b>boş</b> kuyuna düştü ama karşısındaki rakip kuyusu da <b>boş</b>. Ne olur?', qe:'Your last stone landed in your <b>empty</b> pit, but the opposite pit is <b>empty</b> too. What happens?',
  opts:['Taş kuyumda kalır, sıra rakibe geçer','O taşı hazineme alırım','Bir kez daha oynarım'], oe:['The stone stays, the turn passes','I take it to my store','I play again'], a:0,
  ok:'Doğru! Karşıda taş yoksa hiçbir şey alınmaz.', oke:'Correct! Nothing is captured if the opposite pit is empty.',
  no:'İpucu: Bu kural ancak karşıda taş varsa işler.', noe:'Hint: this rule only works if there are stones opposite.'},
 {type:'bot', t:'Rakip de Aynı Kurallarla Oynar ⚠️', te:'Your Opponent Uses the Same Rules ⚠️', board:[1,3,2,0,4,2,8, 2,3,1,2,4,1,15], pit:11,
  x:'Rakibin de bu kuralların hepsini kullanır! Senin taşlarını da alabilir.<br><br>Rakibinin parlayan kuyusunda 4 taş var ve senin [[first]] kuyunda 1 taş duruyor. Hamlesini izle.',
  xe:'Your opponent uses all these rules too and can capture your stones!<br><br>Their glowing pit has 4 stones and your [[first_en]] pit has 1 stone. Watch their move.',
  after:'Rakibin son taşı senin kuyunu <b>2</b> yaptı (çift) ve o taşları aldı! Kuyularında <b>tek sayıda</b> taş bırakmamaya dikkat et.', afe:'Their last stone made your pit <b>2</b> (even) and captured it! Be careful about leaving <b>odd</b> numbers in your pits.'},
 {type:'move', t:'Oyunun Sonu 🏁', te:'End of the Game 🏁', board:[0,0,0,0,0,1,22, 2,0,3,0,0,1,19], pit:5,
  x:'Bir oyuncunun <b>kendi tarafındaki bütün kuyular boşaldığında</b> oyun biter.<br>⭐ Taşları <b>İLK BİTEN</b> oyuncu, rakibinin kuyularında kalan <b>bütün taşları da</b> alır!<br><br>Sende tek bir taş kaldı. 👆 Onu oyna.',
  xe:'The game ends when <b>all pits on one side are empty</b>.<br>⭐ The player who <b>runs out FIRST</b> also takes <b>all stones left</b> on the opponent\'s side!<br><br>You have one stone left. 👆 Play it.',
  after:'Tek taş hazinene geçti ve <b>tarafın tamamen boşaldı</b>: oyun bitti! Rakibin kuyularındaki <b>6 taş da senin</b> oldu.', afe:'The stone went to your store and <b>your side is empty</b>: game over! The <b>6 stones</b> on your opponent\'s side are yours too.'},
 {t:'Kazanan Kim? 🏆', te:'Who Wins? 🏆', hl:[6],
  x:'Oyun bittiğinde hazinelerdeki taşlar sayılır, <b>en çok taşı olan kazanır</b>. 48 taşın yarısı 24 olduğundan <b>25 taş</b> kesin galibiyettir. <b>24 – 24</b> beraberliktir.<br><br>Bu oyunda sen <b>29</b>, rakibin <b>19</b> taş topladı: <b>KAZANDIN!</b>',
  xe:'At the end the stores are counted and <b>the most stones wins</b>. Since half of 48 is 24, <b>25 stones</b> guarantees victory. <b>24 – 24</b> is a draw.<br><br>Here you have <b>29</b>, your opponent <b>19</b>: <b>YOU WIN!</b>'},
 {type:'quiz', t:'Son Sınav (1/5)', te:'Final Quiz (1/5)', q:'4 taşlı bir kuyunu oynuyorsun. <b>İlk taş</b> nereye bırakılır?', qe:'You play a pit with 4 stones. Where does the <b>first stone</b> go?',
  opts:['Sıradaki kuyuya','Taşları aldığım kuyunun kendisine','Hazineme'], oe:['The next pit','Back into the same pit','My store'], a:1, ok:'Doğru!', oke:'Correct!', no:'Hatırla: ilk taş aynı kuyuya döner.', noe:'Remember: the first stone goes back.'},
 {type:'quiz', t:'Son Sınav (2/5)', te:'Final Quiz (2/5)', q:'Kuyunda <b>sadece 1 taş</b> varsa ne olur?', qe:'What if your pit has <b>only 1 stone</b>?',
  opts:['Aynı kuyuda kalır','Sıradaki kuyuya geçer','O kuyu oynanamaz'], oe:['It stays','It moves to the next pit','It can\'t be played'], a:1, ok:'Doğru!', oke:'Correct!', no:'Tek taş kuralını hatırla.', noe:'Remember the single stone rule.'},
 {type:'quiz', t:'Son Sınav (3/5)', te:'Final Quiz (3/5)', q:'Son taşın <b>kendi hazinene</b> düşerse?', qe:'Your last stone lands in <b>your own store</b>?',
  opts:['Sıra rakibe geçer','Bir kez daha oynarım','Rakibin kuyusunu alırım'], oe:['Turn passes','I play again','I take an opponent pit'], a:1, ok:'Doğru!', oke:'Correct!', no:'Hazine kuralı ⭐', noe:'Store rule ⭐'},
 {type:'quiz', t:'Son Sınav (4/5)', te:'Final Quiz (4/5)', q:'Dağıtırken <b>rakibin hazinesine</b> taş koyulur mu?', qe:'Do you drop stones in your <b>opponent\'s store</b>?',
  opts:['Evet','Hayır, atlanır'], oe:['Yes','No, it\'s skipped'], a:1, ok:'Doğru!', oke:'Correct!', no:'12 taşlı kuyuyu hatırla.', noe:'Remember the 12-stone pit.'},
 {type:'quiz', t:'Son Sınav (5/5)', te:'Final Quiz (5/5)', q:'Taşları <b>ilk biten</b> oyuncu ne kazanır?', qe:'What does the player who <b>runs out first</b> get?',
  opts:['Hiçbir şey','Rakibin kuyularında kalan bütün taşları','Oyunu kaybeder'], oe:['Nothing','All stones left on the opponent\'s side','They lose'], a:1, ok:'Doğru!', oke:'Correct!', no:'Oyunun sonu adımı 🏁', noe:'The end-of-game step 🏁'},
 {type:'final', t:'Eğitim Tamamlandı! 🎓', te:'Tutorial Complete! 🎓',
  x:'Tebrikler, artık Mangala\'nın <b>bütün kurallarını</b> biliyorsun!<br>• İlk taş aynı kuyuya, tek taş yan kuyuya<br>• Son taş hazinede → tekrar oyna<br>• Rakibin hazinesi atlanır<br>• Çift sayı → rakibin taşlarını al<br>• Boş kuyu → karşıdaki taşları al<br>• Taşları ilk biten, rakibin kalan taşlarını alır<br><br>Ödülün: <b>'+TUT_BONUS+' 🪙</b>. Kuralları menüdeki <b>📜 Kurallar</b> bölümünden tekrar okuyabilirsin.',
  xe:'Congratulations, you now know <b>all the rules</b> of Mangala!<br>• First stone back in the same pit, a single stone moves on<br>• Last stone in your store → play again<br>• Skip the opponent\'s store<br>• Even number → capture<br>• Empty pit → capture the opposite stones<br>• Running out first takes the rest<br><br>Your reward: <b>'+TUT_BONUS+' 🪙</b>. You can reread the rules in <b>📜 Rules</b>.'}
];
const TUT_WORDS={
  h:{me:'Alttaki',me_en:'bottom',mestore:'Sağdaki',mestore_en:'right',oppstore:'soldaki',oppstore_en:'left',first:'en soldaki',first_en:'leftmost',opp7:'sağ baştaki',opp7_en:'rightmost',
     dir:'kendi kuyularında <b>soldan sağa</b>, sonra <b>kendi hazinene</b>, sonra rakibin kuyularında <b>sağdan sola</b>',dir_en:'<b>left to right</b> on your side, into <b>your store</b>, then <b>right to left</b> on your opponent\'s side'},
  v:{me:'Sol sütundaki',me_en:'left column',mestore:'Alttaki',mestore_en:'bottom',oppstore:'üstteki',oppstore_en:'top',first:'en üstteki',first_en:'top',opp7:'en alttaki',opp7_en:'bottom',
     dir:'kendi kuyularında <b>yukarıdan aşağıya</b>, sonra <b>kendi hazinene</b>, sonra rakibin kuyularında <b>aşağıdan yukarıya</b>',dir_en:'<b>top to bottom</b> on your side, into <b>your store</b>, then <b>bottom to top</b> on your opponent\'s side'}
};
const RULES={
 tr:`<h3>🎯 Amaç</h3><p>Oyun sonunda hazinende rakibinden daha çok taş toplamak.</p>
<h3>🪵 Tahta ve Başlangıç</h3><ul><li>Her oyuncunun 6 kuyusu (toplam 12) ve 1 hazinesi vardır.</li><li>Her kuyuya 4 taş konur (toplam 48). Hazineler boş başlar.</li><li>İlk oynayan kura ile belirlenir.</li></ul>
<h3>✋ Hamle</h3><ul><li>Kendi tarafındaki, içinde taş olan bir kuyu seçilir ve tüm taşlar alınır.</li><li>İlk taş alınan kuyuya bırakılır, kalanlar saat yönünün tersine birer birer dağıtılır.</li><li><b>Tek taş kuralı:</b> Kuyuda tek taş varsa o taş sıradaki kuyuya geçer.</li><li>Kendi hazinene taş koyulur, <b>rakibin hazinesi atlanır</b>.</li></ul>
<h3>⭐ Özel Kurallar</h3><ul><li><b>Hazine kuralı:</b> Son taş kendi hazinene düşerse bir kez daha oynarsın.</li><li><b>Çift sayı kuralı:</b> Son taş rakibin kuyusunu çift yaparsa o kuyudaki tüm taşlar senindir.</li><li><b>Boş kuyu kuralı:</b> Son taş kendi boş kuyuna düşer ve karşıda taş varsa, o taş ile karşıdaki taşlar senindir.</li></ul>
<h3>🏁 Oyun Sonu</h3><ul><li>Bir oyuncunun tarafı boşalınca oyun biter; taşları ilk biten, rakibin tarafındaki kalan taşları da alır.</li><li>Çok taşı olan kazanır. 24–24 beraberliktir.</li></ul>
<h3>🎮 Oyun Modları</h3><ul><li><b>⚡ Yıldırım:</b> Her hamle 8 saniye.</li><li><b>🔄 Ters Mangala:</b> En az taş toplayan kazanır.</li><li><b>🌱 Mini Mangala:</b> Her kuyuda 3 taş (toplam 36), hızlı maçlar.</li><li><b>🏔️ Dev Mangala:</b> Her kuyuda 6 taş (toplam 72), uzun ve taktik maçlar.</li><li><b>❓ Gizemli Kuyu:</b> ❓ kuyudan alınan taşlar 2 kat; son taşı oraya düşürmek +2 puan.</li><li><b>🃏 Süper Güçler:</b> ❄️ Dondur (rakip kuyusunu 1 tur kilitler), 🔀 Takas (iki komşu kuyunu değiştirir), 🛡️ Kalkan (bir tur taş kaptırmazsın). Kart kullanmak sıranı bitirmez.</li></ul>
<h3>🌍 Çevrimiçi</h3><ul><li>Hamle süresi 30 sn (yıldırımda 8 sn). Süre dolarsa rastgele hamle yapılır.</li><li>Oyundan ayrılan kaybetmiş sayılır. Dereceli maçlar Elo puanını değiştirir.</li></ul>`,
 en:`<h3>🎯 Goal</h3><p>Have more stones in your store than your opponent at the end.</p>
<h3>🪵 Board & Setup</h3><ul><li>Each player has 6 pits (12 total) and 1 store.</li><li>Each pit starts with 4 stones (48 total). Stores start empty.</li><li>A coin toss decides who starts.</li></ul>
<h3>✋ Moving</h3><ul><li>Choose a pit on your side with stones and pick them all up.</li><li>The first stone goes back into the same pit, the rest are sown counter-clockwise one by one.</li><li><b>Single stone:</b> a lone stone moves to the next pit.</li><li>You drop stones in your own store but <b>skip your opponent's store</b>.</li></ul>
<h3>⭐ Special Rules</h3><ul><li><b>Store rule:</b> last stone in your store → play again.</li><li><b>Even rule:</b> if your last stone makes an opponent pit even, capture it.</li><li><b>Empty pit rule:</b> if your last stone lands in your empty pit with stones opposite, capture both.</li></ul>
<h3>🏁 End</h3><ul><li>When one side is empty the game ends; the player who ran out takes the remaining stones.</li><li>Most stones wins. 24–24 is a draw.</li></ul>
<h3>🎮 Modes</h3><ul><li><b>⚡ Blitz:</b> 8 seconds per move.</li><li><b>🔄 Reverse:</b> fewest stones wins.</li><li><b>🌱 Mini:</b> 3 stones per pit (36 total), quick games.</li><li><b>🏔️ Giant:</b> 6 stones per pit (72 total), long tactical games.</li><li><b>❓ Mystery Pit:</b> stones captured from ❓ count double; landing there gives +2.</li><li><b>🃏 Power Cards:</b> ❄️ Freeze, 🔀 Swap, 🛡️ Shield — using a card doesn't end your turn.</li></ul>
<h3>🌍 Online</h3><ul><li>30 s per move (8 s in blitz). Time out = random move.</li><li>Leaving counts as a loss. Ranked games change your Elo.</li></ul>`
};
