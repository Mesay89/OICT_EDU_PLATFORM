import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

// Bot link opens Telegram app → Register / Login (same backend as website)
// Username without @ — e.g. onlinelearning_tb_bot
const TELEGRAM_BOT = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'onlinelearning_tb_bot';
const TELEGRAM_URL = `https://t.me/${TELEGRAM_BOT}?start=welcome`;

const TelegramIcon = ({ className = 'h-7 w-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const FloatingBots = () => {
  const { user } = useContext(AuthContext);

  // ── Message bot (left) — real in-app chat with support admin ──
  const [showMessageBot, setShowMessageBot] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [supportAdmin, setSupportAdmin] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  const initSupportChat = useCallback(async () => {
    if (!user?.token) return;
    setChatLoading(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: admin } = await axios.get(`${BASE_URL}/messages/support`, cfg);
      setSupportAdmin(admin);

      const { data: conversations } = await axios.get(`${BASE_URL}/messages/conversations`, cfg);
      const existing = conversations.find((c) =>
        c.participants.some((p) => (p._id || p).toString() === admin._id.toString())
      );

      if (existing) {
        setConversationId(existing._id);
        const { data: msgs } = await axios.get(`${BASE_URL}/messages/${existing._id}`, cfg);
        setChatMessages(msgs);
      } else {
        setConversationId(null);
        setChatMessages([]);
      }
    } catch (err) {
      console.error('Support chat init failed', err);
    } finally {
      setChatLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (showMessageBot && user) initSupportChat();
  }, [showMessageBot, user, initSupportChat]);

  useEffect(() => {
    if (!showMessageBot || !conversationId || !user?.token) return;
    const poll = setInterval(async () => {
      try {
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${BASE_URL}/messages/${conversationId}`, cfg);
        setChatMessages(data);
      } catch {
        /* silent */
      }
    }, 4000);
    return () => clearInterval(poll);
  }, [showMessageBot, conversationId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !user?.token || !supportAdmin) return;
    setChatSending(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: sent } = await axios.post(
        `${BASE_URL}/messages`,
        { recipientId: supportAdmin._id, content: chatMessage.trim() },
        cfg
      );
      if (!conversationId) {
        const { data: conversations } = await axios.get(`${BASE_URL}/messages/conversations`, cfg);
        const conv = conversations.find((c) =>
          c.participants.some((p) => (p._id || p).toString() === supportAdmin._id.toString())
        );
        if (conv) setConversationId(conv._id);
      }
      setChatMessages((prev) => [...prev, sent]);
      setChatMessage('');
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setChatSending(false);
    }
  };

  const handleTelegramClick = () => {
    window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Message Bot — Bottom Left */}
      <div className="fixed bottom-6 left-6 z-50">
        {showMessageBot && (
          <div className="mb-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 w-80 flex flex-col max-h-[28rem]">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-white" />
                <span className="text-white font-semibold text-sm">
                  {supportAdmin ? `Chat with ${supportAdmin.name}` : 'Support Chat'}
                </span>
              </div>
              <button onClick={() => setShowMessageBot(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!user ? (
              <div className="p-6 text-center text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-4">Sign in to chat with our support team in real time.</p>
                <Link to="/login" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm" onClick={() => setShowMessageBot(false)}>
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[12rem]">
                  {chatLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                      Send a message — our team will reply here.
                    </p>
                  ) : (
                    chatMessages.map((msg) => {
                      const isOwn = (msg.sender?._id || msg.sender)?.toString() === user._id?.toString();
                      return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t dark:border-zinc-700 flex gap-2 shrink-0">
                  <input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={chatSending || !supportAdmin}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={chatSending || !chatMessage.trim() || !supportAdmin}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {chatSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setShowMessageBot(!showMessageBot)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center relative"
        >
          <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-75" />
          <MessageCircle className={`h-6 w-6 relative z-10 transition-transform ${showMessageBot ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Telegram — Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleTelegramClick}
          aria-label="Open Online Learning on Telegram"
          className="bg-[#229ED9] hover:bg-[#1a8bc4] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center relative"
        >
          <span className="absolute inset-0 rounded-full bg-[#229ED9] animate-ping opacity-40" />
          <TelegramIcon className="h-7 w-7 relative z-10" />
        </button>
      </div>
    </>
  );
};

export default FloatingBots;
