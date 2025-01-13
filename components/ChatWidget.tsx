'use client';

import React, { useState } from 'react';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Welcome to Betty Organic! How can we help with your fresh organic fruit delivery today? 🍎 🍌 🥝', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: inputText, sender: 'user' }]);

    // Call our chat API
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: inputText }),
    });

    const data = await res.json();
    setMessages(prev => [
      ...prev,
      { text: data.response, sender: 'bot' },
      ...(data.suggestions?.map((suggestion: string) => ({ text: `💡 ${suggestion}`, sender: 'bot' })) || []),
      ...(data.links?.map((link: { text: string, url: string }) => ({ text: `🔗 ${link.text}: ${link.url}`, sender: 'bot' })) || [])
    ]);

    setInputText('');
  };

  return (
    <div className={`fixed bottom-4 left-4 z-[1000] ${isOpen ? 'mb-20' : ''}`}>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-green-600 hover:bg-green-700 text-white font-bold
          py-3 px-6 rounded-full shadow-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Ask About Organic Delivery 🥗
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col">
          <div className="bg-green-600 p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center">
              <span className="mr-2">🌱</span>
              Betty Organic Fruit Chat
            </h3>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about our organic fruits..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={handleSendMessage}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
