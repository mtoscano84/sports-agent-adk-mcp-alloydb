import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const StoreMap = ({ stores, userLocation }) => {
  // Default to Barcelona's coordinates
  const defaultCenter = [41.3851, 2.1734];
  
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer 
        center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })}
          >
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Store markers */}
        {stores.map((store, index) => (
          <Marker 
            key={`store-${index}`}
            position={[store.latitude, store.longitude]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })}
          >
            <Popup>
              <div style={{ fontWeight: 500 }}>{store.name}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Distance: {(store.distance / 1000).toFixed(2)} km
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default StoreMap; 