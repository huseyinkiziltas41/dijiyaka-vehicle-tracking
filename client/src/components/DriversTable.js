import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://philip-morris-tracking.onrender.com/api' 
  : 'http://localhost:3000/api';

const DriversTable = ({ drivers, onDriverDeleted }) => {
  const [deletingDriver, setDeletingDriver] = useState(null);
  const formatLastUpdate = (dateString) => {
    if (!dateString) return 'Hiç güncellenmedi';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇'; // En yakın
      case 1: return '🥈'; // İkinci
      case 2: return '🥉'; // Üçüncü
      default: return `${index + 1}.`; // Diğerleri
    }
  };

  const handleDeleteDriver = async (driver) => {
    if (!window.confirm(`${driver.name} adlı sürücüyü silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      return;
    }

    setDeletingDriver(driver.id);
    try {
      const response = await axios.delete(`${API_BASE_URL}/driver/${driver.id}`);
      
      if (response.data.success) {
        alert(`${driver.name} başarıyla silindi.`);
        if (onDriverDeleted) {
          onDriverDeleted(driver.id);
        }
      }
    } catch (error) {
      console.error('Sürücü silme hatası:', error);
      alert('Sürücü silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setDeletingDriver(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'online': { text: 'Aktif', class: 'status-online' },
      'offline': { text: 'Çevrimdışı', class: 'status-offline' },
      'en-route': { text: 'Yolda', class: 'status-en-route' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-offline' };
    
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (drivers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚛</div>
        <div className="empty-state-title">Henüz kayıtlı sürücü yok</div>
        <div className="empty-state-description">
          Sürücüler mobil uygulamadan kayıt olduklarında burada görünecekler.
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="drivers-table">
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Sürücü</th>
            <th>Araç Plakası</th>
            <th>Durum</th>
            <th>Mesafe</th>
            <th>Son Güncelleme</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver, index) => (
            <tr key={driver.id}>
              <td>
                <div style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                  {getRankIcon(index)}
                </div>
              </td>
              <td>
                <div className="driver-name">{driver.name}</div>
                <div className="driver-phone">{driver.phone}</div>
              </td>
              <td>
                <span className="vehicle-plate">{driver.vehiclePlate}</span>
              </td>
              <td>
                {getStatusBadge(driver.status)}
              </td>
              <td>
                {driver.distanceToFactory ? (
                  <span className={`distance-badge ${index === 0 ? 'closest' : index === 1 ? 'second' : index === 2 ? 'third' : ''}`}>
                    {driver.distanceToFactory} km
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Konum yok</span>
                )}
              </td>
              <td>
                <div className="last-update">
                  {formatLastUpdate(driver.lastUpdate)}
                </div>
              </td>
              <td>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteDriver(driver)}
                  disabled={deletingDriver === driver.id}
                  title={`${driver.name} sürücüsünü sil`}
                >
                  {deletingDriver === driver.id ? '⏳' : '🗑️'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DriversTable;
