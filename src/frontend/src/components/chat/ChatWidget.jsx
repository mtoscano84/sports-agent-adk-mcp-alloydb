import React, { useState } from 'react';

const BACKEND_URL = 'http://localhost:8001';

console.log('BACKEND_URL:', BACKEND_URL);

const ChatWidget = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI sports shopping assistant. How can I help you find the perfect gear today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

    try {
      // Using relative URL to work with Vite proxy
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response, isUser: false }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "I'm sorry, I encountered an error. Please try again.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  function formatMessage(text) {
    if (text.includes('Here are some products:')) {
      const lines = text.split('\n').filter(line => line.trim());
      
      return (
        <div className="products-container">
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {lines.map((line, index) => {
              if (line.trim().startsWith('•')) {
                // Extract just the product name without the bullet point
                const productName = line.substring(1).trim().split('\n')[0];
                const description = lines[index + 1] && !lines[index + 1].startsWith('•') ? lines[index + 1] : '';
                
                // Use the full backend URL for images since they're not proxied
                const imageUrl = `${BACKEND_URL}/images/${encodeURIComponent(productName)}.png`;
                
                console.log('Product Name:', productName);
                console.log('Image URL:', imageUrl);
                
                return (
                  <li key={index} style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    margin: '10px 0',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}>
                    <img 
                      src={imageUrl}
                      alt={productName}
                      onClick={() => setSelectedImage(imageUrl)}
                      onError={(e) => {
                        console.error('Failed to load image:', imageUrl);
                        const imgElement = e.target as HTMLImageElement;
                        console.error('Failed URL:', imgElement.src);
                      }}
                      style={{ 
                        width: '100px', 
                        height: '100px',
                        objectFit: 'contain',
                        marginRight: '10px',
                        border: '1px solid #ccc',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{productName}</div>
                      {description && (
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                          {description}
                        </div>
                      )}
                    </div>
                  </li>
                );
              }
              return null;
            }).filter(Boolean)}
          </ul>
        </div>
      );
    }
    
    return <span>{text}</span>;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ colorScheme: 'light' }}>
        <div style={{
          backgroundColor: 'white',
          width: '100%',
          maxWidth: '1024px',
          height: '600px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'  // this is the shadow-2xl equivalent
        }}>
          {/* Chat Header */}
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="material-icons">sports_handball</span>
              <h3 className="font-bold text-lg">GenAISports Assistant</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200"
              aria-label="Close chat"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Updated Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`p-4 rounded-lg max-w-[80%] text-lg ${
                      msg.isUser 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white shadow-sm border border-gray-200'
                    }`}
                  >
                    {msg.isUser ? (
                      <span>{msg.text}</span>
                    ) : (
                      formatMessage(msg.text)
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-lg flex items-center space-x-2 shadow-sm border border-gray-200">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '24px',
                  border: '1px solid #ccc',
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  colorScheme: 'light'
                }}
                placeholder="Type your message..."
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                →
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add the image modal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage}
            alt="Enlarged view"
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

export default ChatWidget;