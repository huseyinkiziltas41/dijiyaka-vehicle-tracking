const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Philip Morris factory coordinates
const FACTORY_LOCATION = {
  lat: 38.19970884298463,
  lng: 27.367337114805427,
  name: "Philip Morris Fabrikası"
};

// In-memory storage for drivers (in production, use a database)
let drivers = [];
let deletedDrivers = []; // Soft deleted drivers
let activeConnections = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// API Routes
app.get('/api/drivers', (req, res) => {
  const driversWithDistance = drivers.map(driver => ({
    ...driver,
    distanceToFactory: driver.location ? 
      calculateDistance(
        driver.location.lat, 
        driver.location.lng, 
        FACTORY_LOCATION.lat, 
        FACTORY_LOCATION.lng
      ).toFixed(2) : null
  }));
  
  // Sort by distance to factory (closest first)
  driversWithDistance.sort((a, b) => {
    if (!a.distanceToFactory && !b.distanceToFactory) return 0;
    if (!a.distanceToFactory) return 1;
    if (!b.distanceToFactory) return -1;
    return parseFloat(a.distanceToFactory) - parseFloat(b.distanceToFactory);
  });
  
  res.json(driversWithDistance);
});

app.get('/api/factory-location', (req, res) => {
  res.json(FACTORY_LOCATION);
});

app.post('/api/driver/register', (req, res) => {
  const { name, phone, vehiclePlate } = req.body;
  
  if (!name || !phone || !vehiclePlate) {
    return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
  }

  // Check if driver exists in deleted drivers (restore if found)
  const deletedDriverIndex = deletedDrivers.findIndex(d => 
    d.phone === phone && d.vehiclePlate === vehiclePlate
  );
  
  if (deletedDriverIndex !== -1) {
    // Restore deleted driver
    const restoredDriver = deletedDrivers[deletedDriverIndex];
    restoredDriver.name = name; // Update name in case it changed
    restoredDriver.status = 'offline';
    restoredDriver.location = null;
    restoredDriver.destination = null;
    restoredDriver.lastUpdate = new Date();
    
    drivers.push(restoredDriver);
    deletedDrivers.splice(deletedDriverIndex, 1);
    
    // Broadcast to admin dashboard
    io.emit('driverRestored', restoredDriver);
    
    return res.json({ success: true, driverId: restoredDriver.id, restored: true });
  }

  // Check if driver already exists in active drivers
  const existingDriver = drivers.find(d => d.phone === phone && d.vehiclePlate === vehiclePlate);
  if (existingDriver) {
    return res.status(400).json({ error: 'Bu telefon ve plaka ile kayıtlı sürücü zaten mevcut' });
  }

  const driver = {
    id: uuidv4(),
    name,
    phone,
    vehiclePlate,
    status: 'offline',
    location: null,
    destination: null,
    lastUpdate: new Date(),
    createdAt: new Date()
  };

  drivers.push(driver);
  
  // Broadcast to admin dashboard
  io.emit('driverRegistered', driver);
  
  res.json({ success: true, driverId: driver.id });
});

app.post('/api/driver/login', (req, res) => {
  const { phone, vehiclePlate } = req.body;
  
  const driver = drivers.find(d => d.phone === phone && d.vehiclePlate === vehiclePlate);
  
  if (!driver) {
    return res.status(401).json({ error: 'Sürücü bulunamadı' });
  }

  driver.status = 'online';
  driver.lastUpdate = new Date();
  
  // Broadcast to admin dashboard
  io.emit('driverStatusChanged', driver);
  
  res.json({ success: true, driver });
});

app.post('/api/driver/logout', (req, res) => {
  const { driverId } = req.body;
  
  const driver = drivers.find(d => d.id === driverId);
  
  if (!driver) {
    return res.status(404).json({ error: 'Sürücü bulunamadı' });
  }

  driver.status = 'offline';
  driver.lastUpdate = new Date();
  
  // Broadcast to admin dashboard
  io.emit('driverStatusChanged', driver);
  
  res.json({ success: true });
});

app.post('/api/driver/location', (req, res) => {
  const { driverId, location } = req.body;
  
  let driver = drivers.find(d => d.id === driverId);
  
  // If driver not found in active drivers, check deleted drivers and restore
  if (!driver) {
    const deletedDriverIndex = deletedDrivers.findIndex(d => d.id === driverId);
    if (deletedDriverIndex !== -1) {
      // Restore deleted driver when they share location
      const restoredDriver = deletedDrivers[deletedDriverIndex];
      restoredDriver.status = 'online';
      restoredDriver.location = location;
      restoredDriver.lastUpdate = new Date();
      
      drivers.push(restoredDriver);
      deletedDrivers.splice(deletedDriverIndex, 1);
      
      driver = restoredDriver;
      
      // Broadcast restoration to admin dashboard
      io.emit('driverRestored', driver);
    } else {
      return res.status(404).json({ error: 'Sürücü bulunamadı' });
    }
  } else {
    driver.location = location;
    driver.lastUpdate = new Date();
  }
  
  // Calculate distance to factory
  const distance = calculateDistance(
    location.lat, 
    location.lng, 
    FACTORY_LOCATION.lat, 
    FACTORY_LOCATION.lng
  );
  
  // Broadcast to admin dashboard
  io.emit('locationUpdate', {
    driverId: driver.id,
    location,
    distanceToFactory: distance.toFixed(2)
  });
  
  res.json({ success: true, distanceToFactory: distance.toFixed(2) });
});

app.post('/api/driver/destination', (req, res) => {
  const { driverId, destination } = req.body;
  
  const driver = drivers.find(d => d.id === driverId);
  
  if (!driver) {
    return res.status(404).json({ error: 'Sürücü bulunamadı' });
  }

  driver.destination = destination;
  driver.lastUpdate = new Date();
  
  // Broadcast to admin dashboard
  io.emit('destinationUpdate', {
    driverId: driver.id,
    destination
  });
  
  res.json({ success: true });
});

// Delete driver endpoint (soft delete)
app.delete('/api/driver/:driverId', (req, res) => {
  const { driverId } = req.params;
  
  const driverIndex = drivers.findIndex(d => d.id === driverId);
  
  if (driverIndex === -1) {
    return res.status(404).json({ error: 'Sürücü bulunamadı' });
  }

  const deletedDriver = drivers[driverIndex];
  deletedDriver.deletedAt = new Date();
  deletedDriver.status = 'deleted';
  
  // Move to deleted drivers array
  deletedDrivers.push(deletedDriver);
  drivers.splice(driverIndex, 1);
  
  // Broadcast to admin dashboard
  io.emit('driverDeleted', { driverId });
  
  res.json({ success: true, message: 'Sürücü silindi' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);
  
  activeConnections.set(socket.id, {
    connectedAt: new Date(),
    type: 'unknown'
  });

  socket.on('joinAdmin', () => {
    socket.join('admin');
    activeConnections.set(socket.id, {
      ...activeConnections.get(socket.id),
      type: 'admin'
    });
    console.log('Admin paneline bağlandı:', socket.id);
  });

  socket.on('joinDriver', (driverId) => {
    socket.join(`driver_${driverId}`);
    activeConnections.set(socket.id, {
      ...activeConnections.get(socket.id),
      type: 'driver',
      driverId
    });
    console.log('Sürücü bağlandı:', driverId);
  });

  socket.on('disconnect', () => {
    console.log('Bağlantı kesildi:', socket.id);
    activeConnections.delete(socket.id);
  });
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚛 Philip Morris Araç Takip Sistemi ${PORT} portunda çalışıyor`);
  console.log(`📍 Fabrika Konumu: ${FACTORY_LOCATION.lat}, ${FACTORY_LOCATION.lng}`);
  console.log(`🌐 Admin Panel: http://localhost:${PORT}`);
});

module.exports = app;
