import React from 'react';

const Header = ({ connectionStatus }) => {
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Bağlı';
      case 'disconnected':
        return 'Bağlantı Kesildi';
      case 'connecting':
        return 'Bağlanıyor...';
      default:
        return 'Bilinmiyor';
    }
  };

  const getConnectionClass = () => {
    return `connection-indicator connection-${connectionStatus}`;
  };

  return (
    <header className="App-header">
      <div className="header-content">
        <div className="header-title">
          <div className="company-logo">🚛</div>
          <div>
            <h1>Philip Morris</h1>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              Araç Takip Sistemi
            </div>
          </div>
        </div>
        <div className="header-status">
          <div className={getConnectionClass()}></div>
          <span>{getConnectionStatusText()}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
