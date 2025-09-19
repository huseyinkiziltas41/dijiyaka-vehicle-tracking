import React, { useState } from 'react';
import StatsCards from './StatsCards';
import DriversTable from './DriversTable';
import MapView from './MapView';

const Dashboard = ({ drivers, factoryLocation, socket, onDriverDeleted }) => {
  const [activeTab, setActiveTab] = useState('active');

  // Aktif sürücüler: Son 5 dakika içinde konum paylaşanlar
  const activeDrivers = drivers.filter(driver => {
    if (!driver.lastUpdate) return false;
    const lastUpdate = new Date(driver.lastUpdate);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    return diffMinutes <= 5;
  });

  // Tüm sürücüler
  const allDrivers = drivers;

  const currentDrivers = activeTab === 'active' ? activeDrivers : allDrivers;

  return (
    <div className="dashboard-container">
      <div className="stats-section">
        <StatsCards drivers={drivers} />
      </div>
      
      <div className="dashboard-grid">
        <div className="drivers-section">
          <div className="section-header">
            <div className="tabs-container">
              <button 
                className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Aktif Sürücüler ({activeDrivers.length})
              </button>
              <button 
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tüm Sürücüler ({allDrivers.length})
              </button>
            </div>
          </div>
          <DriversTable drivers={currentDrivers} onDriverDeleted={onDriverDeleted} />
        </div>
        
        <div className="map-section">
          <div className="section-header">
            <h2 className="section-title">Harita Görünümü</h2>
          </div>
          <div className="map-container">
            <MapView drivers={activeDrivers} factoryLocation={factoryLocation} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
