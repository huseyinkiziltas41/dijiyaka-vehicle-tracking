import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://philip-morris-tracking.onrender.com/api';

export default function LocationScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [distance, setDistance] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationInterval, setLocationInterval] = useState(null);

  useEffect(() => {
    loadDriverId();
    requestLocationPermission();
    
    // Cleanup interval on component unmount
    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [locationInterval]);

  const loadDriverId = async () => {
    try {
      const id = await AsyncStorage.getItem('driverId');
      setDriverId(id);
    } catch (error) {
      console.error('Error loading driver ID:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli',
          'Bu uygulamanın çalışması için konum izni gereklidir.',
          [
            { text: 'İptal', onPress: () => navigation.goBack() },
            { text: 'Ayarlar', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }
      getCurrentLocation();
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(currentLocation.coords);
      calculateDistance(currentLocation.coords);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Hata', 'Konum alınamadı. Lütfen GPS\'in açık olduğundan emin olun.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (coords) => {
    // Philip Morris factory coordinates
    const factoryLat = 38.19970884298463;
    const factoryLng = 27.367337114805427;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (factoryLat - coords.latitude) * Math.PI / 180;
    const dLon = (factoryLng - coords.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coords.latitude * Math.PI / 180) * Math.cos(factoryLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    setDistance(distance.toFixed(2));
  };

  const sendLocationUpdate = async (currentLocation) => {
    if (!currentLocation || !driverId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/driver/location`, {
        driverId: driverId,
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude
        }
      });

      if (response.data.success) {
        const newDistance = response.data.distanceToFactory;
        setDistance(newDistance);
        console.log(`Konum güncellendi: ${newDistance} km, ETA: ${response.data.etaMinutes} dk`);
      }
    } catch (error) {
      console.error('Konum güncelleme hatası:', error);
    }
  };

  const startLocationTracking = async () => {
    if (!location || !driverId) {
      Alert.alert('Hata', 'Konum veya sürücü bilgisi bulunamadı');
      return;
    }

    setIsSharing(true);
    
    // İlk konum paylaşımı
    await sendLocationUpdate(location);
    
    // Set destination to factory
    try {
      await axios.post(`${API_BASE_URL}/driver/destination`, {
        driverId: driverId,
        destination: 'Philip Morris Fabrikası'
      });
    } catch (error) {
      console.error('Hedef ayarlama hatası:', error);
    }

    // Her 1 dakikada bir konum güncelle
    const interval = setInterval(async () => {
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setLocation(currentLocation.coords);
        await sendLocationUpdate(currentLocation.coords);
      } catch (error) {
        console.error('Otomatik konum güncelleme hatası:', error);
      }
    }, 60000); // 60 saniye = 1 dakika

    setLocationInterval(interval);
    
    Alert.alert(
      'Konum Takibi Başladı',
      `Konumunuz her dakika otomatik olarak güncelleniyor.\nFabrikaya mesafe: ${distance} km`,
      [
        { text: 'Tamam' },
        { text: 'Takibi Durdur', onPress: stopLocationTracking }
      ]
    );
  };

  const stopLocationTracking = () => {
    if (locationInterval) {
      clearInterval(locationInterval);
      setLocationInterval(null);
      setIsSharing(false);
      Alert.alert('Bilgi', 'Konum takibi durduruldu');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Konum Paylaşımı</Text>
        <Text style={styles.headerSubtitle}>
          GPS konumunuzu Philip Morris yönetim sistemine gönderin
        </Text>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>Mevcut Konumunuz</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e3a8a" />
            <Text style={styles.loadingText}>Konum alınıyor...</Text>
          </View>
        ) : location ? (
          <View>
            <View style={styles.coordsContainer}>
              <Text style={styles.coordsLabel}>Enlem:</Text>
              <Text style={styles.coordsValue}>{location.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.coordsContainer}>
              <Text style={styles.coordsLabel}>Boylam:</Text>
              <Text style={styles.coordsValue}>{location.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.coordsContainer}>
              <Text style={styles.coordsLabel}>Doğruluk:</Text>
              <Text style={styles.coordsValue}>±{location.accuracy?.toFixed(0)}m</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noLocationText}>Konum bulunamadı</Text>
        )}
      </View>

      {distance && (
        <View style={styles.distanceCard}>
          <Text style={styles.cardTitle}>🏭 Fabrikaya Mesafe</Text>
          <Text style={styles.distanceValue}>{distance} km</Text>
          <Text style={styles.distanceSubtext}>Philip Morris Fabrikası</Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            {loading ? 'Güncelleniyor...' : '🔄 Konumu Yenile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.shareButton, (!location || isSharing) && styles.buttonDisabled]}
          onPress={isSharing ? stopLocationTracking : startLocationTracking}
          disabled={!location}
        >
          <Text style={styles.shareButtonText}>
            {isSharing ? '⏹️ Takibi Durdur' : '📍 Konum Takibini Başlat'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ Bilgi</Text>
        <Text style={styles.infoText}>
          • Konum takibi her 1 dakikada bir otomatik güncellenir{'\n'}
          • Fabrikaya olan mesafe ve tahmini varış süresi hesaplanır{'\n'}
          • 5 dakikadan fazla güncelleme yoksa durumunuz pasif olur{'\n'}
          • Takibi istediğiniz zaman başlatıp durdurabilirsiniz
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  locationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  coordsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  coordsLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  coordsValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  noLocationText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748b',
    paddingVertical: 20,
  },
  distanceCard: {
    backgroundColor: '#10b981',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  distanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 8,
  },
  distanceSubtext: {
    fontSize: 16,
    color: '#d1fae5',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  shareButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoContainer: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
});
