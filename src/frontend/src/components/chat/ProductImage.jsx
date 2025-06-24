import React from 'react';
import { useState } from 'react';

interface ProductImageProps {
  imageUrl: string;
  productName: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ imageUrl, productName }) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    console.log('Image clicked:', imageUrl);
    setShowModal(true);
  };

  return (
    <>
      <div 
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <img 
          src={imageUrl}
          alt={productName}
          style={{ 
            width: '100px', 
            height: '100px',
            objectFit: 'contain',
            marginRight: '10px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowModal(false)}
        >
          <img 
            src={imageUrl}
            alt={productName}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px'
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ProductImage; 