import React from 'react';

const Header = ({ connectionStatus }) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Bağlı';
      case 'connecting': return 'Bağlanıyor...';
      case 'disconnected': return 'Bağlantı Kesildi';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="version-badge">v2.1.0</div>
          <h1 className="header-title">DİJİYAKA Araç Takip Sistemi</h1>
          <div className="header-subtitle">Yönetim Paneli</div>
        </div>
        <div className="header-right">
          <div className="connection-status">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor() }}
            ></div>
            <span className="status-text">{getStatusText()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
