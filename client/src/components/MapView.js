import React, { useEffect, useRef } from 'react';

const MapView = ({ drivers, factoryLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Load Leaflet dynamically
    if (typeof window !== 'undefined' && window.L && factoryLocation) {
      initializeMap();
    } else {
      // Load Leaflet script if not available
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (factoryLocation) {
          initializeMap();
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [factoryLocation]);

  useEffect(() => {
    if (mapInstanceRef.current && drivers) {
      updateMarkers();
    }
  }, [drivers]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L || !factoryLocation) return;

    // Initialize map centered on factory
    const map = window.L.map(mapRef.current).setView(
      [factoryLocation.lat, factoryLocation.lng], 
      12
    );

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add factory marker
    const factoryIcon = window.L.divIcon({
      html: '<div style="background: #1e3a8a; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">🏭</div>',
      className: 'factory-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    window.L.marker([factoryLocation.lat, factoryLocation.lng], { icon: factoryIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: #1e3a8a;">${factoryLocation.name}</strong><br>
          <small style="color: #64748b;">DİJİYAKA Fabrikası</small>
        </div>
      `);

    mapInstanceRef.current = map;
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing driver markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add driver markers
    drivers.forEach(driver => {
      if (driver.location) {
        const isOnline = driver.status === 'online';
        const driverIcon = window.L.divIcon({
          html: `<div style="background: ${isOnline ? '#10b981' : '#ef4444'}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">🚛</div>`,
          className: 'driver-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = window.L.marker([driver.location.lat, driver.location.lng], { icon: driverIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="padding: 12px; min-width: 200px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <strong style="color: #1e293b;">${driver.name}</strong>
                <span style="background: ${isOnline ? '#dcfce7' : '#fee2e2'}; color: ${isOnline ? '#166534' : '#991b1b'}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                  ${isOnline ? 'AKTİF' : 'ÇEVRİMDIŞI'}
                </span>
              </div>
              <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">
                📱 ${driver.phone}
              </div>
              <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">
                🚗 ${driver.vehiclePlate}
              </div>
              ${driver.distanceToFactory ? `
                <div style="background: #dbeafe; color: #1d4ed8; padding: 6px 10px; border-radius: 8px; font-weight: 600; text-align: center;">
                  📍 Fabrikaya ${driver.distanceToFactory} km
                </div>
              ` : ''}
            </div>
          `);

        markersRef.current.push(marker);
      }
    });
  };

  if (!factoryLocation) {
    return (
      <div className="loading-card">
        <div className="loading-spinner"></div>
        <div className="loading-text">Harita yükleniyor...</div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapView;
