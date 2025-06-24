import React from 'react';

const StoreList: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n').filter(line => line.trim());
  const stores = lines
    .filter(line => line.includes('|'))
    .map(line => {
      const [name, info] = line.split('|');
      const [distance] = info.split(',').map(Number);
      return { name, distance_meters: distance };
    });

  if (stores.length === 0) return <span>{text}</span>;

  return (
    <div style={{ padding: '10px' }}>
      {stores.map((store, index) => (
        <div
          key={index}
          style={{
            margin: '10px 0',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{store.name}</div>
          <div style={{ color: '#666', fontSize: '0.9em' }}>
            {(store.distance_meters / 1000).toFixed(2)} km away
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoreList; 