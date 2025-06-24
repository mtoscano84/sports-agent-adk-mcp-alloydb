import React from 'react';

interface OrderDisplayProps {
  text: string;
}

const OrderDisplay: React.FC<OrderDisplayProps> = ({ text }) => {
  // Parse the order text
  const lines = text.split('\n').filter(line => line.trim());
  
  // Check if this is an order message
  if (!text.includes('Order:')) {
    return <span>{text}</span>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 my-2">
      {lines.map((line, index) => {
        if (line.startsWith('• Order:')) {
          return <h3 key={index} className="font-bold text-lg mb-2">{line.substring(2)}</h3>;
        }
        if (line.startsWith('Store:')) {
          return <p key={index} className="text-gray-600">{line}</p>;
        }
        if (line.startsWith('Total Amount:')) {
          return <p key={index} className="font-semibold text-green-600">{line}</p>;
        }
        if (line.startsWith('Status:')) {
          return (
            <p key={index} className="mt-2">
              <span className="font-semibold">Status: </span>
              <span className={`inline-block px-2 py-1 rounded ${
                line.includes('pending') ? 'bg-yellow-100 text-yellow-800' :
                line.includes('completed') ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {line.split(':')[1].trim()}
              </span>
            </p>
          );
        }
        if (line.startsWith('Items:')) {
          return <h4 key={index} className="font-semibold mt-4 mb-2">Items:</h4>;
        }
        if (line.startsWith('-')) {
          return (
            <div key={index} className="ml-4 mb-2 p-2 bg-gray-50 rounded">
              {line}
            </div>
          );
        }
        return <p key={index} className="text-gray-700">{line}</p>;
      })}
    </div>
  );
};

export default OrderDisplay; 