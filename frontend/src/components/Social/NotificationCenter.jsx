import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { Bell, BellOff, CheckCircle, ClipboardList, Info, X, User as UserIcon } from 'lucide-react';
import BASE_URL from '../../api/config';

const NotificationCenter = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/notifications`, config);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/notifications/${id}/read`, {}, config);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/notifications/read-all`, {}, config);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => {
          const next = !showDrawer;
          setShowDrawer(next);
          if (next) markAllAsRead();
        }}
        className="relative p-2 text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {showDrawer && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setShowDrawer(false)}
          ></div>
          <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-[101] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
              <h3 className="font-black text-xl text-gray-900 dark:text-white">Alerts</h3>
              <button 
                onClick={() => setShowDrawer(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 text-center opacity-50">
                  <BellOff className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-gray-400">All quiet for now!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                  {notifications.map(n => (
                    <div 
                      key={n._id} 
                      onClick={() => !n.isRead && markAsRead(n._id)}
                      className={`p-5 flex gap-4 transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer ${!n.isRead ? 'bg-indigo-50/10 border-l-4 border-indigo-600' : ''}`}
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
                        n.type === 'assignment_graded' || n.type === 'course_approved' ? 'bg-emerald-100 text-emerald-600' :
                        n.type === 'assignment_submitted' || n.type === 'course_approval_requested' ? 'bg-amber-100 text-amber-600' :
                        n.type === 'refund_requested' || n.type === 'course_rejected' ? 'bg-red-100 text-red-600' :
                        n.type === 'instructor_pending' ? 'bg-purple-100 text-purple-600' :
                        n.type === 'assignment_released' ? 'bg-blue-100 text-blue-600' :
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                        {n.type === 'assignment_graded' || n.type === 'course_approved' ? <CheckCircle className="h-5 w-5" /> :
                         n.type === 'assignment_submitted' || n.type === 'course_approval_requested' ? <ClipboardList className="h-5 w-5" /> :
                         n.type === 'refund_requested' || n.type === 'course_rejected' ? <X className="h-5 w-5" /> :
                         n.type === 'instructor_pending' ? <UserIcon className="h-5 w-5" /> :
                         <Info className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black truncate ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 text-center">
                <button 
                  onClick={fetchNotifications}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                >
                  Refresh Feed
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
