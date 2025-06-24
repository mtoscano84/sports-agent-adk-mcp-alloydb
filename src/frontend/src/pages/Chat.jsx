import React, { useState } from 'react';

const Chat = () => {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI sports shopping assistant. How can I help you find the perfect gear today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Convert frontend messages to backend format
  const getHistoryForBackend = () => {
    return messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

    try {
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: getHistoryForBackend()
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, { text: data.response, isUser: false }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting right now. Please try again later.", 
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lines.map((line, index) => {
            if (line.includes('Here are some products:')) {
              return <div key={index}>{line}</div>;
            }
            
            if (line.startsWith('•')) {
              // Extract just the product name without the bullet point
              const productName = line.substring(1).trim().split('\n')[0];
              const description = lines[index + 1] && !lines[index + 1].startsWith('•') ? lines[index + 1] : '';
              
              // Use the correct backend URL
              const imageUrl = `http://localhost:8001/images/${encodeURIComponent(productName)}.png`;
              
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '4px'
                }}>
                  <img 
                    src={imageUrl}
                    alt={productName}
                    style={{ 
                      width: '100px',
                      height: '100px',
                      objectFit: 'contain',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      padding: '4px'
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
                </div>
              );
            }
            
            return null;
          }).filter(Boolean)}
        </div>
      );
    }
    
    return <span style={{ whiteSpace: 'pre-line' }}>{text}</span>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg">GenAISports Assistant</h3>
        </div>
        
        <div className="h-[600px] p-4 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`p-3 rounded-lg max-w-[80%] ${
                msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}>
                {formatMessage(msg.text)}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-600"
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`rounded-full p-2 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={isLoading}
            >
              <span className="material-icons">
                {isLoading ? 'hourglass_empty' : 'send'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 