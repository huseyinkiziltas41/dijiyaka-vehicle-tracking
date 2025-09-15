# 🚛 Philip Morris Araç Takip Sistemi - Kurulum Rehberi

Bu rehber, projeyi sıfırdan çalıştırmak için gerekli tüm adımları içerir.

## 📋 Gereksinimler

Sisteminizde şunların kurulu olması gerekir:
- **Node.js** (v16 veya üzeri) - [nodejs.org](https://nodejs.org) adresinden indirin
- **npm** (Node.js ile birlikte gelir)
- **Git** (opsiyonel, proje paylaşımı için)

## 🚀 Kurulum Adımları

### 1. Projeyi İndirin/Kopyalayın
```bash
# Eğer zip dosyası aldıysanız, klasörü açın
# Eğer git kullanıyorsanız:
git clone [proje-url]
cd bismillahirrahmanirrahim
```

### 2. Ana Dizinde Backend Bağımlılıklarını Yükleyin
```bash
# Ana proje klasöründe (package.json dosyasının olduğu yerde)
npm install
```

### 3. Client Bağımlılıklarını Yükleyin
```bash
# Client klasörüne girin
cd client

# Client bağımlılıklarını yükleyin
npm install

# Ana klasöre geri dönün
cd ..
```

### 4. Client'ı Build Edin
```bash
# Ana klasörde (client klasörünün dışında)
cd client
npm run build
cd ..
```

### 5. Sunucuyu Başlatın
```bash
# Ana klasörde
npm start
```

## ✅ Başarılı Kurulum Kontrolü

Eğer her şey doğru gittiyse, terminalde şu mesajları göreceksiniz:
```
🚛 Philip Morris Araç Takip Sistemi 3000 portunda çalışıyor
📍 Fabrika Konumu: 38.19970884298463, 27.367337114805427
🌐 Admin Panel: http://localhost:3000
```

## 🌐 Admin Panel'e Erişim

Tarayıcınızda şu adrese gidin:
**http://localhost:3000**

Dashboard'da şunları göreceksiniz:
- 5 mock sürücü (İstanbul, Ankara, İzmir, Şanlıurfa, Antalya)
- Mesafeye göre sıralama (en yakın üstte)
- İnteraktif harita
- Gerçek zamanlı istatistikler

## 🔧 Alternatif Çalıştırma Yöntemleri

### Geliştirme Modu (İki Terminal)
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend (ayrı bir terminal açın)
cd client
npm start
```
Bu durumda:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

### Production Modu
```bash
# Client build (bir kez yapın)
cd client
npm run build
cd ..

# Production server
npm start
```

## 🛠️ Sorun Giderme

### Port Zaten Kullanımda Hatası
```bash
# Windows'ta port 3000'i kullanan işlemi sonlandırın
netstat -ano | findstr :3000
taskkill /PID [PID_NUMARASI] /F

# Veya farklı port kullanın
set PORT=3001 && npm start
```

### Node Modules Sorunu
```bash
# Ana klasörde
rm -rf node_modules
npm install

# Client klasöründe
cd client
rm -rf node_modules
npm install
cd ..
```

### Build Sorunu
```bash
cd client
npm run build
cd ..
```

## 📁 Proje Yapısı

```
bismillahirrahmanirrahim/
├── server.js              # Ana backend server
├── package.json           # Backend bağımlılıkları
├── README.md              # Proje dokümantasyonu
├── KURULUM-REHBERI.md     # Bu dosya
└── client/                # Frontend React uygulaması
    ├── package.json       # Frontend bağımlılıkları
    ├── public/
    ├── src/
    └── build/             # Build edilmiş dosyalar
```

## 🔄 Güncellemeler

Proje güncellendiğinde:
```bash
# Backend bağımlılıkları
npm install

# Frontend bağımlılıkları
cd client
npm install
npm run build
cd ..

# Sunucuyu yeniden başlat
npm start
```

## 📞 Destek

Sorun yaşarsanız:
1. Terminal'deki hata mesajlarını kontrol edin
2. Node.js ve npm versiyonlarını kontrol edin: `node -v` ve `npm -v`
3. Port 3000'in boş olduğundan emin olun
4. Antivirus yazılımının Node.js'i engellemediğini kontrol edin

## 🎯 Başarılı Kurulum Sonrası

Admin panel açıldığında şunları göreceksiniz:
- **İstatistik Kartları**: 5 toplam sürücü, 4 aktif, 4 yolda
- **Sürücü Tablosu**: Mesafeye göre sıralı liste
- **Harita**: Philip Morris fabrikası ve sürücü konumları
- **Gerçek Zamanlı Bağlantı**: Yeşil nokta ile "Bağlı" durumu

Sistem hazır! 🎉
