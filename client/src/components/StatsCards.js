import React from 'react';

const StatsCards = ({ drivers }) => {
  const totalDrivers = drivers.length;
  const onlineDrivers = drivers.filter(d => d.status === 'online').length;
  const enRouteDrivers = drivers.filter(d => d.location && d.destination).length;
  
  const avgDistance = drivers.length > 0 
    ? (drivers
        .filter(d => d.distanceToFactory)
        .reduce((sum, d) => sum + parseFloat(d.distanceToFactory), 0) / 
       drivers.filter(d => d.distanceToFactory).length).toFixed(1)
    : '0.0';

  const stats = [
    {
      title: 'Toplam Sürücü',
      value: totalDrivers,
      icon: '👥',
      iconClass: 'drivers',
      change: null
    },
    {
      title: 'Aktif Sürücü',
      value: onlineDrivers,
      icon: '🟢',
      iconClass: 'online',
      change: `${totalDrivers > 0 ? Math.round((onlineDrivers / totalDrivers) * 100) : 0}% aktif`
    },
    {
      title: 'Yolda Olan',
      value: enRouteDrivers,
      icon: '🚛',
      iconClass: 'en-route',
      change: `${onlineDrivers > 0 ? Math.round((enRouteDrivers / onlineDrivers) * 100) : 0}% yolda`
    },
    {
      title: 'Ort. Mesafe',
      value: `${avgDistance} km`,
      icon: '📍',
      iconClass: 'avg-distance',
      change: 'Fabrikaya uzaklık'
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-header">
            <div className="stat-title">{stat.title}</div>
            <div className={`stat-icon ${stat.iconClass}`}>
              {stat.icon}
            </div>
          </div>
          <div className="stat-value">{stat.value}</div>
          {stat.change && (
            <div className="stat-change">{stat.change}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
