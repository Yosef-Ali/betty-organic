'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isChatVisible, setCartOpen } = useUIStore();
  const [messages, setMessages] = useState([
    { text: 'Welcome to Betty Organic! How can we help with your fresh organic fruit delivery today? 🍎 🍌 🥝', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: inputText, sender: 'user' }]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Call our chat API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await res.json();

      // Hide typing indicator
      setIsTyping(false);

      setMessages(prev => [
        ...prev,
        { text: data.response, sender: 'bot' },
        ...(data.suggestions?.map((suggestion: string) => ({ text: `💡 ${suggestion}`, sender: 'bot' })) || []),
        ...(data.links?.map((link: { text: string, url: string }) => ({ text: `🔗 ${link.text}: ${link.url}`, sender: 'bot' })) || [])
      ]);
    } catch (error) {
      console.error('Error calling chat API:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again later.', sender: 'bot' }]);
    }

    setInputText('');
  };

  return (
    <div className={`fixed bottom-4 right-4 z-[1000] ${!isChatVisible ? 'hidden' : ''}`}>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl w-[350px] md:w-[400px] h-[550px] flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="mr-2 text-xl">🌱</span>
                <span>Betty Organic Fruit Chat</span>
              </h3>
              <button
                onClick={toggleChat}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (idx % 3) }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'user'
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none'
                        }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm max-w-[85%]">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2 items-center">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about our organic fruits..."
                  className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-md transition-colors"
                  disabled={!inputText.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChat}
            className="bg-gradient-to-r from-green-600 to-green-500 text-white font-medium
            py-4 px-5 rounded-full shadow-lg flex items-center"
          >
            <span className="text-xl mr-2">💬</span>
            <span>Chat with Betty Organic</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;
