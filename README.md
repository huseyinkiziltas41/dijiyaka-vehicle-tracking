# Dijiyaka Araç Takip Sistemi

 Sürücülerin konumlarını gerçek zamanlı olarak takip eder ve fabrikaya olan mesafelerini hesaplar.

## 🚀 Özellikler

### Yönetim Paneli
- **Gerçek zamanlı sürücü takibi** - Socket.IO ile anlık güncellemeler
- **İnteraktif harita görünümü** - Leaflet harita entegrasyonu
- **Mesafe hesaplamaları** - Fabrikaya olan uzaklık hesabı
- **Profesyonel UI** - Lacivert ve beyaz tema
- **İstatistik kartları** - Toplam, aktif, yolda olan sürücü sayıları
- **Responsive tasarım** - Mobil uyumlu arayüz

### Mobil Uygulama API'leri
- **Güvenli kayıt/giriş sistemi**
- **Konum paylaşımı**
- **Hedef seçimi**
- **Gerçek zamanlı konum güncellemeleri**

## 🏭 Fabrika Bilgileri

**Fabrika**
- Koordinatlar: `38.19970884298463, 27.367337114805427`
- Sistem bu koordinatlara olan mesafeleri otomatik hesaplar

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Gerçek zamanlı iletişim
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **Leaflet** - Harita entegrasyonu
- **Socket.IO Client** - Gerçek zamanlı bağlantı

## 📦 Kurulum

### 1. Bağımlılıkları Yükle

```bash
# Ana proje bağımlılıkları
npm install

# Client bağımlılıkları
cd client
npm install
cd ..
```

### 2. Geliştirme Modunda Çalıştır

```bash
# Backend server (Port 3000)
npm run dev

# Yeni terminal açın - Frontend (Port 3001)
npm run client
```

### 3. Production Build

```bash
# Client build
npm run build

# Production server
npm start
```

## 🌐 API Endpoints

### Sürücü Yönetimi
- `GET /api/drivers` - Tüm sürücüleri listele
- `POST /api/driver/register` - Yeni sürücü kaydı
- `POST /api/driver/login` - Sürücü girişi
- `POST /api/driver/location` - Konum güncelleme
- `POST /api/driver/destination` - Hedef güncelleme

### Sistem Bilgileri
- `GET /api/factory-location` - Fabrika koordinatları

## 🔄 Gerçek Zamanlı Olaylar

### Admin Panel Olayları
- `driverRegistered` - Yeni sürücü kaydı
- `driverStatusChanged` - Sürücü durum değişikliği
- `locationUpdate` - Konum güncelleme
- `destinationUpdate` - Hedef güncelleme

### Sürücü Olayları
- `joinAdmin` - Admin paneline bağlan
- `joinDriver` - Sürücü olarak bağlan

## 🎨 UI Tasarım

### Renk Paleti
- **Ana Renk**: Lacivert (#1e3a8a)
- **İkincil Renk**: Beyaz (#ffffff)
- **Arka Plan**: Açık gri tonları
- **Vurgu Renkleri**: Yeşil (aktif), Kırmızı (çevrimdışı), Sarı (yolda)

### Bileşenler
- **Header**: Logo, başlık ve bağlantı durumu
- **Stats Cards**: İstatistik kartları
- **Drivers Table**: Sürücü listesi tablosu
- **Map View**: İnteraktif harita görünümü

## 🚀 Deployment

Sistem ücretsiz online servislere deploy edilebilir:
- **Heroku** (Backend)
- **Netlify/Vercel** (Frontend)
- **Railway** (Full-stack)

## 📱 Mobil Uygulama

Mobil uygulama ayrı bir React Native projesi olarak geliştirilecek ve bu backend API'lerini kullanacak.

### Güvenlik Özellikleri
- Galeri erişimi yok
- Banka hesabı erişimi yok
- Sadece konum ve temel bilgiler
- Güvenli authentication

## 🔧 Geliştirme Notları

- Gerçek production ortamında veritabanı kullanın (MongoDB, PostgreSQL)
- Environment variables ile konfigürasyon
- Rate limiting ve güvenlik middleware'leri ekleyin
- Logging ve monitoring sistemi kurun

## 📞 Destek

Herhangi bir sorun veya özellik talebi için lütfen iletişime geçin.
