import React from 'react';
import StatsCards from './StatsCards';
import DriversTable from './DriversTable';
import MapView from './MapView';

const Dashboard = ({ drivers, factoryLocation, socket }) => {
  return (
    <div className="dashboard-container">
      <div className="stats-section">
        <StatsCards drivers={drivers} />
      </div>
      
      <div className="dashboard-grid">
        <div className="drivers-section">
          <div className="section-header">
            <h2 className="section-title">Aktif Sürücüler</h2>
          </div>
          <DriversTable drivers={drivers} />
        </div>
        
        <div className="map-section">
          <div className="section-header">
            <h2 className="section-title">Harita Görünümü</h2>
          </div>
          <div className="map-container">
            <MapView drivers={drivers} factoryLocation={factoryLocation} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
