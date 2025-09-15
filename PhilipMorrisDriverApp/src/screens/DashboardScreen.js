import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://philip-morris-tracking.onrender.com/api';

export default function DashboardScreen({ navigation }) {
  const [driverData, setDriverData] = useState(null);
  const [factoryLocation, setFactoryLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDriverData();
    loadFactoryLocation();
  }, []);

  const loadDriverData = async () => {
    try {
      const data = await AsyncStorage.getItem('driverData');
      if (data) {
        setDriverData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    }
  };

  const loadFactoryLocation = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/factory-location`);
      setFactoryLocation(response.data);
    } catch (error) {
      console.error('Error loading factory location:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              // Set driver status to offline before logout
              const driverId = await AsyncStorage.getItem('driverId');
              if (driverId) {
                await axios.post(`${API_BASE_URL}/driver/logout`, {
                  driverId: driverId
                });
              }
            } catch (error) {
              console.error('Logout API error:', error);
            } finally {
              await AsyncStorage.multiRemove(['driverId', 'driverData']);
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverData();
    await loadFactoryLocation();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Aktif';
      case 'offline': return 'Çevrimdışı';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
        <Text style={styles.driverName}>{driverData?.name}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Telefon:</Text>
          <Text style={styles.infoValue}>{driverData?.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Araç Plakası:</Text>
          <Text style={styles.vehiclePlate}>{driverData?.vehiclePlate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Durum:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driverData?.status) }]}>
            <Text style={styles.statusText}>{getStatusText(driverData?.status)}</Text>
          </View>
        </View>
      </View>

      {factoryLocation && (
        <View style={styles.factoryCard}>
          <Text style={styles.cardTitle}>🏭 Hedef Lokasyon</Text>
          <Text style={styles.factoryName}>{factoryLocation.name}</Text>
          <Text style={styles.factoryCoords}>
            {factoryLocation.lat.toFixed(6)}, {factoryLocation.lng.toFixed(6)}
          </Text>
          {distance && (
            <Text style={styles.distanceText}>
              📍 Mesafe: {distance} km
            </Text>
          )}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => navigation.navigate('Location')}
        >
          <Text style={styles.locationButtonIcon}>📍</Text>
          <Text style={styles.locationButtonText}>Konum Paylaş</Text>
          <Text style={styles.locationButtonSubtext}>GPS konumunu gönder</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.securityInfo}>
        <Text style={styles.securityTitle}>🔒 Güvenlik Bilgisi</Text>
        <Text style={styles.securityText}>
          Bu uygulama sadece iş amaçlı konum bilginizi paylaşır. Kişisel verileriniz güvende tutulur.
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
  welcomeText: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 5,
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  vehiclePlate: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  factoryCard: {
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
    marginBottom: 10,
  },
  factoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  factoryCoords: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  locationButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  locationButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  locationButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  locationButtonSubtext: {
    fontSize: 14,
    color: '#d1fae5',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  securityInfo: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
});
