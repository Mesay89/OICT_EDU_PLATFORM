import { useState } from 'react';
import { MessageCircle, Send, X, Phone } from 'lucide-react';

const FloatingBots = () => {
  const [showMessageBot, setShowMessageBot] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      // Create WhatsApp message link
      const phoneNumber = '251939648955'; // Ethiopian number without +
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setMessage('');
      setShowMessageBot(false);
    }
  };

  const handleTelegramClick = () => {
    // Open Telegram chat with username
    window.open('https://t.me/mesay_dev', '_blank');
  };

  return (
    <>
      {/* Message Bot - Bottom Left */}
      <div className="fixed bottom-6 left-6 z-50">
        {showMessageBot && (
          <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 animate-slide-up">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">Send us a message</span>
              </div>
              <button
                onClick={() => setShowMessageBot(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                Hi! How can we help you today?
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                rows="4"
              />
              <button
                onClick={handleSendMessage}
                className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Send className="h-4 w-4" />
                Send via WhatsApp
              </button>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                <span>+251 939 648 955</span>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowMessageBot(!showMessageBot)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
        >
          <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-75"></span>
          <MessageCircle className={`h-6 w-6 relative z-10 transition-transform duration-300 ${showMessageBot ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Telegram Bot - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleTelegramClick}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
        >
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></span>
          
          <svg 
            className="h-6 w-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
          </svg>
        </button>
        
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap">
            Chat on Telegram
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingBots;