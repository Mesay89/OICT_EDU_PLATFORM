import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Send, User, Search, MessageSquare, Loader2, ArrowLeft, MoreVertical, Paperclip, Smile, Clock, CheckCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const emojis = ["👋", "⭐", "👍", "💡", "🔥", "💯", "🙏", "🎓", "✅", "🚀"];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const markAsRead = async () => {
      if (!activeConv || activeConv._id === 'new' || activeConv._id === 'loading') return;
      try {
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.put(`${BASE_URL}/messages/read/${activeConv._id}`, {}, cfg);
        window.dispatchEvent(new Event('refreshUnread'));
      } catch (err) {
        console.error('Error marking messages as read');
      }
    };
    markAsRead();
  }, [activeConv, user]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      try {
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${BASE_URL}/messages/conversations`, cfg);
        setConversations(data);

        // If userId in URL, auto-select OR initiate
        if (userId) {
          // Robust ID check
          const existing = data.find(c => 
            c.participants.some(p => (p._id?.toString() || p) === userId.toString())
          );
          
          if (existing) {
            setActiveConv(existing);
          } else {
            // Temporary loading state for the specific person
            setActiveConv({ _id: 'loading', participants: [{ _id: user._id }, { _id: userId, name: 'Loading...' }] });
            
            try {
              const { data: userData } = await axios.get(`${BASE_URL}/comm/user/${userId}`, cfg);
              const dummyConv = {
                _id: 'new', // Temp ID
                participants: [user, userData],
                lastMessage: '',
                lastMessageAt: new Date().toISOString()
              };
              setActiveConv(dummyConv);
            } catch (err) {
              console.error('Failed to initiate conversation', err);
              setActiveConv(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoadingConv(false);
      }
    };

    fetchConversations();
  }, [user, userId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConv || activeConv._id === 'new') return;
      setLoadingMsgs(true);
      try {
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${BASE_URL}/messages/${activeConv._id}`, cfg);
        setMessages(data);
        setTimeout(scrollToBottom, 50);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoadingMsgs(false);
      }
    };

    fetchMessages();
  }, [activeConv, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const recipient = activeConv.participants.find(p => p._id !== user._id);
    if (!recipient) return;

    setSending(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/messages`, {
        recipientId: recipient._id,
        content: newMessage
      }, cfg);
      
      setMessages([...messages, data]);
      setNewMessage('');
      setShowSent(true);
      setTimeout(() => setShowSent(false), 3000);
      
      // If it's a new conversation, re-fetch list to get real ID
      if (activeConv._id === 'new') {
        const { data: convData } = await axios.get(`${BASE_URL}/messages/conversations`, cfg);
        setConversations(convData);
        const newActive = convData.find(c => c.participants.some(p => p._id === recipient._id));
        if (newActive) setActiveConv(newActive);
      } else {
        setConversations(conversations.map(c => 
          c._id === activeConv._id ? { ...c, lastMessage: data.content, lastMessageAt: data.createdAt } : c
        ).sort((a,b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
      }
      
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loadingConv) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-indigo-600 h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Sidebar - Enhanced Glassmorphic Conversation List */}
      <div className={`w-full md:w-80 lg:w-[400px] border-r border-gray-100 dark:border-zinc-800 flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl relative z-20 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-gray-100 dark:border-zinc-800">
           <div className="flex items-center justify-between mb-8">
             <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Inbox</h1>
             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                <MessageSquare className="h-6 w-6" />
             </div>
           </div>
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-gray-50 dark:bg-zinc-950 p-5 pl-14 rounded-[24px] border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700 dark:text-white shadow-inner"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 scrollbar-hide no-scrollbar">
          {conversations.length === 0 && !activeConv ? (
            <div className="text-center px-10 py-20 space-y-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-950 rounded-[40px] flex items-center justify-center mx-auto shadow-inner">
                 <MessageSquare className="h-10 w-10 text-gray-200" />
              </div>
              <div>
                 <p className="font-black text-xl text-gray-900 dark:text-white mb-2">No conversations yet.</p>
                 <p className="text-sm font-medium text-gray-500 leading-relaxed">Connect with instructors from your course catalog to start a private workspace.</p>
              </div>
              <Link to="/courses" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
                 <Search className="h-4 w-4" /> Discover Mentors
              </Link>
            </div>
          ) : (
            [
              ...(activeConv && !conversations.some(c => c._id === activeConv._id) ? [activeConv] : []), 
              ...conversations
            ].map((conv) => {
              const otherUser = conv.participants.find(p => (p._id?.toString() || p) !== user?._id?.toString());
              const isActive = activeConv?._id === conv._id;
              return (
                <button 
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full p-6 flex items-center gap-5 transition-all relative group ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                >
                  {isActive && <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-indigo-600 rounded-r-full shadow-[2px_0_10px_rgba(79,70,229,0.5)]"></div>}
                  <div className="relative flex-shrink-0">
                    {otherUser?.image ? (
                      <img src={otherUser.image} className="w-16 h-16 rounded-[22px] object-cover shadow-xl group-hover:scale-105 transition-transform" alt="" />
                    ) : (
                      <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white dark:ring-zinc-900">
                        {otherUser?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-zinc-900 rounded-full group-hover:scale-110 transition-transform"></div>
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className={`font-black tracking-tight truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>{otherUser?.name}</h3>
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-xs font-bold leading-none truncate ${isActive ? 'text-indigo-500' : 'text-gray-500'}`}>
                      {conv.lastMessage || "Establish connection..."}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area - High Contrast / High Visibility */}
      <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-zinc-950 relative overflow-hidden ${!activeConv ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {/* Background decorative elements */}
        {!activeConv && (
           <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
           </div>
        )}

        {!activeConv ? (
          <div className="relative z-10 text-center space-y-8 animate-in zoom-in-95 duration-1000">
             <div className="w-40 h-40 bg-white dark:bg-zinc-900 rounded-[56px] border border-gray-100 dark:border-zinc-800 flex items-center justify-center mx-auto shadow-2xl relative group">
                <div className="absolute inset-0 bg-indigo-600 rounded-[56px] scale-90 blur-2xl opacity-0 group-hover:opacity-20 transition-all duration-700"></div>
                <MessageSquare className="h-20 w-20 text-indigo-600 dark:text-indigo-400 relative z-10" />
             </div>
             <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight mb-3">Your Support Ecosystem</h2>
                <p className="text-gray-500 font-bold max-w-sm mx-auto text-lg leading-relaxed">Direct, private workspace for expert-led growth and assistance.</p>
             </div>
          </div>
        ) : (
          <>
            {/* High-Visibility Header */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shadow-sm sticky top-0 z-30">
               <div className="flex items-center gap-6">
                  <button onClick={() => setActiveConv(null)} className="md:hidden p-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-500 hover:text-indigo-600 transition-all">
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div className="flex items-center gap-4">
                     {activeConv.participants.find(p => p._id !== user._id)?.image ? (
                        <div className="relative">
                          <img src={activeConv.participants.find(p => p._id !== user._id).image} className="w-14 h-14 rounded-[20px] object-cover ring-2 ring-indigo-500/10 shadow-lg" alt="" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                        </div>
                     ) : (
                       <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20">
                          {activeConv.participants.find(p => p._id !== user._id)?.name?.charAt(0)}
                       </div>
                     )}
                     <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-2">{activeConv.participants.find(p => p._id !== user._id)?.name}</h2>
                        <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                           <span className="text-[10px] font-black tracking-widest text-green-600 uppercase">Secure Connection Active</span>
                        </div>
                     </div>
                  </div>
               </div>
               <button className="p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all shadow-inner">
                  <MoreVertical className="h-6 w-6" />
               </button>
            </div>

            {/* Redesigned Messages Body with better spacing/visibility */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth no-scrollbar">
              {loadingMsgs ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-600 h-12 w-12" />
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.sender?._id === user._id || msg.sender === user._id;
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[80%] lg:max-w-[60%] p-6 rounded-[32px] ${isMine ? 'bg-indigo-600 text-white rounded-tr-none shadow-2xl shadow-indigo-600/20' : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-zinc-800 shadow-xl'}`}>
                         <p className="text-base font-bold leading-relaxed whitespace-pre-wrap tracking-tight">{msg.content}</p>
                         <p className={`text-[10px] mt-4 font-black uppercase tracking-widest flex items-center gap-1.5 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                           <Clock className="h-3 w-3" />
                           {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Section - Activated with Emoji & File Upload */}
            <div className="p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-t border-gray-100 dark:border-zinc-800 shadow-[0_-10px_50px_rgba(0,0,0,0.02)] relative">
               
               {/* Emoji Flyout */}
               {showEmoji && (
                  <div className="absolute bottom-[110%] left-8 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-[32px] shadow-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
                     {emojis.map(emoji => (
                        <button 
                          key={emoji} 
                          type="button"
                          onClick={() => { setNewMessage(prev => prev + emoji); setShowEmoji(false); }}
                          className="text-2xl hover:scale-125 transition-transform"
                        >
                           {emoji}
                        </button>
                     ))}
                  </div>
               )}

               {/* Success Toast */}
               {showSent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[120%] bg-indigo-600 text-white px-6 py-2 rounded-full shadow-2xl font-black text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <CheckCircle className="h-4 w-4" /> Message Delivered
                  </div>
               )}

               <form onSubmit={handleSendMessage} className="max-w-6xl mx-auto flex items-center gap-5">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={(e) => {
                      if(e.target.files[0]) {
                        setNewMessage(prev => prev + ` [Attached File: ${e.target.files[0].name}] `);
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-[28px] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-gray-100 dark:border-zinc-800 shadow-inner"
                  >
                     <Paperclip className="h-7 w-7" />
                  </button>
                  <div className="flex-1 relative group bg-gray-50 dark:bg-zinc-950 rounded-[32px] border-2 border-transparent focus-within:border-indigo-600 dark:focus-within:border-indigo-500 transition-all shadow-inner">
                     <input 
                       type="text" 
                       value={newMessage}
                       onChange={(e) => setNewMessage(e.target.value)}
                       onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                             handleSendMessage(e);
                          }
                       }}
                       placeholder="Craft your professional message here..."
                       className="w-full bg-transparent py-5 px-8 outline-none font-bold text-gray-700 dark:text-white text-lg placeholder:text-gray-400"
                     />
                     <div 
                       onClick={() => setShowEmoji(!showEmoji)}
                       className={`absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all cursor-pointer ${showEmoji ? 'text-indigo-600' : 'text-gray-300 hover:text-indigo-500'}`}
                     >
                        <Smile className="h-7 w-7" />
                     </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="p-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] shadow-2xl shadow-indigo-600/30 active:scale-95 disabled:bg-gray-200 dark:disabled:bg-zinc-800 transition-all group"
                  >
                    {sending ? <Loader2 className="h-7 w-7 animate-spin" /> : <Send className="h-7 w-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  </button>
               </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
