import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:async';
import 'dart:math';

class LocationScreen extends StatefulWidget {
  const LocationScreen({super.key});

  @override
  State<LocationScreen> createState() => _LocationScreenState();
}

class _LocationScreenState extends State<LocationScreen> {
  Position? _currentPosition;
  bool _isSharing = false;
  bool _isLoading = false;
  double? _distanceToFactory;
  String? _driverId;
  Timer? _locationTimer;

  static const String apiBaseUrl = 'https://philip-morris-tracking.onrender.com/api';
  
  // DİJİYAKA factory coordinates
  static const double factoryLat = 38.19970884298463;
  static const double factoryLng = 27.367337114805427;

  @override
  void initState() {
    super.initState();
    _loadDriverId();
    _requestLocationPermission();
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadDriverId() async {
    final prefs = await SharedPreferences.getInstance();
    _driverId = prefs.getString('driverId');
  }

  Future<void> _requestLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showErrorDialog('Konum servisleri kapalı. Lütfen konum servislerini açın.');
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showErrorDialog('Konum izni reddedildi.');
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _showErrorDialog('Konum izni kalıcı olarak reddedildi. Ayarlardan izin verin.');
      return;
    }

    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoading = true;
    });

    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      setState(() {
        _currentPosition = position;
        _distanceToFactory = _calculateDistance(
          position.latitude,
          position.longitude,
          factoryLat,
          factoryLng,
        );
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog('Konum alınamadı: $e');
    }
  }

  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371; // Earth's radius in kilometers
    
    double dLat = _degreesToRadians(lat2 - lat1);
    double dLon = _degreesToRadians(lon2 - lon1);
    
    double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) * cos(_degreesToRadians(lat2)) *
        sin(dLon / 2) * sin(dLon / 2);
    
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    
    return earthRadius * c;
  }

  double _degreesToRadians(double degrees) {
    return degrees * (pi / 180);
  }

  Future<void> _sendLocationUpdate(Position position) async {
    if (_driverId == null) return;

    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/driver/location'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'driverId': _driverId,
          'location': {
            'lat': position.latitude,
            'lng': position.longitude,
          }
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          setState(() {
            _distanceToFactory = data['distanceToFactory'];
          });
          print('Konum güncellendi: ${data['distanceToFactory']} km, ETA: ${data['etaMinutes']} dk');
        }
      }
    } catch (e) {
      print('Konum güncelleme hatası: $e');
    }
  }

  Future<void> _setDestination() async {
    if (_driverId == null) return;

    try {
      await http.post(
        Uri.parse('$apiBaseUrl/driver/destination'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'driverId': _driverId,
          'destination': 'DİJİYAKA Fabrikası'
        }),
      );
    } catch (e) {
      print('Hedef ayarlama hatası: $e');
    }
  }

  void _startLocationTracking() async {
    if (_currentPosition == null || _driverId == null) {
      _showErrorDialog('Konum veya sürücü bilgisi bulunamadı');
      return;
    }

    setState(() {
      _isSharing = true;
    });

    // Send initial location
    await _sendLocationUpdate(_currentPosition!);
    await _setDestination();

    // Start periodic location updates (every 1 minute)
    _locationTimer = Timer.periodic(const Duration(minutes: 1), (timer) async {
      try {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        
        setState(() {
          _currentPosition = position;
        });
        
        await _sendLocationUpdate(position);
      } catch (e) {
        print('Otomatik konum güncelleme hatası: $e');
      }
    });

    _showSuccessDialog(
      'Konum Takibi Başladı',
      'Konumunuz her dakika otomatik olarak güncelleniyor.\nFabrikaya mesafe: ${_distanceToFactory?.toStringAsFixed(2)} km',
    );
  }

  void _stopLocationTracking() {
    _locationTimer?.cancel();
    setState(() {
      _isSharing = false;
    });
    
    _showSuccessDialog('Bilgi', 'Konum takibi durduruldu');
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hata'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Tamam'),
          ),
          if (_isSharing)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _stopLocationTracking();
              },
              child: const Text('Takibi Durdur'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      appBar: AppBar(
        title: const Text(
          '📍 Konum Paylaşımı',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: const Color(0xFF1e3a8a),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1e3a8a), Color(0xFF3b82f6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'GPS konumunuzu DİJİYAKA yönetim sistemine gönderin',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 20),

            // Current Location Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Mevcut Konumunuz',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1e293b),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  if (_isLoading)
                    const Center(
                      child: Column(
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 12),
                          Text(
                            'Konum alınıyor...',
                            style: TextStyle(color: Color(0xFF64748b)),
                          ),
                        ],
                      ),
                    )
                  else if (_currentPosition != null) ...[
                    _buildLocationInfo('Enlem', _currentPosition!.latitude.toStringAsFixed(6)),
                    _buildLocationInfo('Boylam', _currentPosition!.longitude.toStringAsFixed(6)),
                    _buildLocationInfo('Doğruluk', '±${_currentPosition!.accuracy.toStringAsFixed(0)}m'),
                  ] else
                    const Center(
                      child: Text(
                        'Konum bulunamadı',
                        style: TextStyle(
                          color: Color(0xFF64748b),
                          fontSize: 16,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Distance Card
            if (_distanceToFactory != null)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF10b981),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10b981).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const Text(
                      '🏭 Fabrikaya Mesafe',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_distanceToFactory!.toStringAsFixed(2)} km',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      'DİJİYAKA Fabrikası',
                      style: TextStyle(
                        color: Color(0xFFd1fae5),
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),

            // Action Buttons
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _getCurrentLocation,
              icon: const Icon(Icons.refresh),
              label: Text(_isLoading ? 'Güncelleniyor...' : '🔄 Konumu Yenile'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6b7280),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),

            ElevatedButton.icon(
              onPressed: (_currentPosition == null || _isLoading) 
                  ? null 
                  : (_isSharing ? _stopLocationTracking : _startLocationTracking),
              icon: Icon(_isSharing ? Icons.stop : Icons.location_on),
              label: Text(_isSharing ? '⏹️ Takibi Durdur' : '📍 Konum Takibini Başlat'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _isSharing ? const Color(0xFFef4444) : const Color(0xFF1e3a8a),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 30),

            // Info Section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFf0f9ff),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF0ea5e9)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.info, color: Color(0xFF0c4a6e), size: 20),
                      SizedBox(width: 8),
                      Text(
                        'ℹ️ Bilgi',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0c4a6e),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildInfoItem('• Konum takibi her 1 dakikada bir otomatik güncellenir'),
                  _buildInfoItem('• Fabrikaya olan mesafe ve tahmini varış süresi hesaplanır'),
                  _buildInfoItem('• 5 dakikadan fazla güncelleme yoksa durumunuz pasif olur'),
                  _buildInfoItem('• Takibi istediğiniz zaman başlatıp durdurabilirsiniz'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$label:',
            style: const TextStyle(
              fontSize: 16,
              color: Color(0xFF64748b),
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              color: Color(0xFF1e293b),
              fontWeight: FontWeight.w600,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          color: Color(0xFF075985),
        ),
      ),
    );
  }
}
