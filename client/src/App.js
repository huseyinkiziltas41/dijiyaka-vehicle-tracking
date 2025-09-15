import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [factoryLocation, setFactoryLocation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    // Join admin room
    newSocket.emit('joinAdmin');

    // Connection status handlers
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('Admin paneline bağlandı');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('Bağlantı kesildi');
    });

    // Real-time event handlers
    newSocket.on('driverRegistered', (driver) => {
      setDrivers(prev => [...prev, driver]);
    });

    newSocket.on('driverStatusChanged', (updatedDriver) => {
      setDrivers(prev => prev.map(driver => 
        driver.id === updatedDriver.id ? updatedDriver : driver
      ));
    });

    newSocket.on('locationUpdate', (data) => {
      setDrivers(prev => prev.map(driver => 
        driver.id === data.driverId 
          ? { ...driver, location: data.location, distanceToFactory: data.distanceToFactory }
          : driver
      ));
    });

    newSocket.on('destinationUpdate', (data) => {
      setDrivers(prev => prev.map(driver => 
        driver.id === data.driverId 
          ? { ...driver, destination: data.destination }
          : driver
      ));
    });

    // Fetch initial data
    fetchDrivers();
    fetchFactoryLocation();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Sürücüler yüklenirken hata:', error);
    }
  };

  const fetchFactoryLocation = async () => {
    try {
      const response = await fetch('/api/factory-location');
      const data = await response.json();
      setFactoryLocation(data);
    } catch (error) {
      console.error('Fabrika konumu yüklenirken hata:', error);
    }
  };

  return (
    <div className="App">
      <Header connectionStatus={connectionStatus} />
      <Dashboard 
        drivers={drivers} 
        factoryLocation={factoryLocation}
        socket={socket}
      />
    </div>
  );
}

export default App;
