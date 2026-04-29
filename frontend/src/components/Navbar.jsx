import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTimezone } from '../context/TimezoneContext';
import { useTranslation } from 'react-i18next';
import { GraduationCap, LogOut, User as UserIcon, MessageSquare, Globe, Menu, X, Share2, Clock, Sun, Moon, ChevronDown } from 'lucide-react';
import BASE_URL from '../api/config';
import NotificationCenter from './Social/NotificationCenter';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const { timezone, setTimezone } = useTimezone();
  const { isDarkMode, toggleTheme } = useTheme();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/messages/unread`, config);
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Error fetching unread count');
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    window.addEventListener('refreshUnread', fetchUnreadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshUnread', fetchUnreadCount);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const navLinkClass = "relative text-[11px] font-black text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all uppercase tracking-widest px-4 py-2 rounded-full group overflow-hidden";
  const navLinkActiveBar = "absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300";

  return (
    <nav className="border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-[100] shadow-sm h-16 sm:h-20 flex items-center transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0" onClick={() => setIsMenuOpen(false)}>
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl group-hover:rotate-6 transition-all shadow-lg shadow-indigo-600/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">
              OICT TUTOR
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Leftmost Home Link */}
            <Link to="/" className={navLinkClass}>
              {t('nav.home')}
              <span className={navLinkActiveBar}></span>
            </Link>

            <Link to="/courses" className={navLinkClass}>
              {t('nav.courses')}
              <span className={navLinkActiveBar}></span>
            </Link>

            <button 
              onClick={toggleTheme}
              className="p-3 ml-2 mr-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all flex items-center justify-center min-w-[44px] min-h-[44px] group"
              aria-label="Toggle Theme"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6 pointer-events-none text-amber-500 group-hover:rotate-90 group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <Moon className="w-6 h-6 pointer-events-none text-indigo-600 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
              )}
            </button>

            <Link to="/about" className={navLinkClass}>
              {t('nav.about')}
              <span className={navLinkActiveBar}></span>
            </Link>

            <div className="relative group px-1 ml-1">
              <button className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all">
                <Globe className="w-4 h-4" /> Localization <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
              </button>
              
              <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4">Localization</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Language</label>
                    <div className="relative">
                      <select 
                        value={i18n.language || 'en'} 
                        onChange={changeLanguage}
                        className="w-full appearance-none bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500 transition-colors"
                      >
                        <option value="en">English</option>
                        <option value="am">አማርኛ</option>
                        <option value="om">Oromoo</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Currency</label>
                    <div className="relative">
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full appearance-none bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500 transition-colors"
                      >
                        <option value="ETB">ETB - Ethiopian Birr</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Timezone</label>
                    <div className="relative">
                      <select 
                        value={timezone} 
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full appearance-none bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500 transition-colors"
                      >
                        <option value="Africa/Addis_Ababa">EAT (Addis Ababa)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">EST (New York)</option>
                        <option value="Europe/London">GMT (London)</option>
                        <option value="Asia/Dubai">GST (Dubai)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {user && (
              <Link to="/affiliate" className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-1">
                <Share2 className="h-3.5 w-3.5" /> {t('nav.affiliate')}
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-1.5 ml-1">
                <NotificationCenter />
                
                <div className="relative">
                  <Link to="/messages" className="text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 transition-colors relative flex items-center" title="Messages">
                    <MessageSquare className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-[10px] text-white flex items-center justify-center rounded-full font-black animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </div>

                <div className="flex items-center gap-1.5 px-2 ml-1">
                  <div className="flex flex-col items-center">
                    <span className="text-[12px] font-black text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter text-center w-full">
                      {user.role}
                    </span>
                  </div>
                  
                  <Link
                    to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'instructor' ? '/instructor/courses' : '/dashboard'}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
                  >
                    <UserIcon className="h-3 w-3" />
                    {user.role === 'admin' ? "Admin.Dashboard" : user.role === 'instructor' ? "Inst.Dashboard" : "Stud.Dashboard"}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-900/30 ml-1"
                  >
                    <LogOut className="h-3 w-3" /> {t('nav.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-4">
                <Link to="/login" className="text-[11px] font-black text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 uppercase tracking-widest transition-all">{t('nav.login')}</Link>
                <Link to="/register" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-600/25">{t('nav.register')}</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-3">
            {user && <NotificationCenter />}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
              aria-label="Open Menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Mobile Drawer Content */}
      <div 
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-zinc-900 z-[120] shadow-2xl p-8 flex flex-col transform transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter dark:text-white">OICT TUTOR</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:rotate-90 transition-all"
          >
            <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto">
          <Link to="/" className="text-lg font-black text-gray-900 dark:text-white p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all" onClick={() => setIsMenuOpen(false)}>{t('nav.home')}</Link>
          <Link to="/courses" className="text-lg font-black text-gray-900 dark:text-white p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all" onClick={() => setIsMenuOpen(false)}>{t('nav.courses')}</Link>
          <Link to="/about" className="text-lg font-black text-gray-900 dark:text-white p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all" onClick={() => setIsMenuOpen(false)}>{t('nav.about')}</Link>
          
          {user && (
            <>
              <Link to="/messages" className="text-lg font-black text-gray-900 dark:text-white p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-between" onClick={() => setIsMenuOpen(false)}>
                {t('nav.messages')}
                {unreadCount > 0 && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>}
              </Link>
              <Link to="/affiliate" className="text-lg font-black text-emerald-600 p-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <Share2 className="h-5 w-5" /> {t('nav.affiliate')}
              </Link>
            </>
          )}

          <div className="h-px bg-gray-100 dark:bg-zinc-800 my-2"></div>

          <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-[2rem] space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Language</span>
                <button 
                  onClick={toggleTheme}
                  className="p-3 bg-white dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-full border border-gray-100 dark:border-zinc-700 flex items-center justify-center min-w-[44px] min-h-[44px] shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all group"
                  aria-label="Toggle Theme"
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 pointer-events-none text-amber-500 group-hover:rotate-90 group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Moon className="w-5 h-5 pointer-events-none text-indigo-600 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'am', name: 'አማርኛ' },
                  { code: 'om', name: 'Oromoo' },
                  { code: 'es', name: 'Español' },
                  { code: 'fr', name: 'Français' },
                  { code: 'ar', name: 'العربية' }
                ].map(lang => (
                  <button 
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setIsMenuOpen(false); }}
                    className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 transition-all ${i18n.language === lang.code ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white bg-white dark:bg-zinc-950'}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Currency</span>
              <div className="grid grid-cols-3 gap-2">
                {['ETB', 'USD', 'EUR'].map(cur => (
                  <button 
                    key={cur}
                    onClick={() => { setCurrency(cur); setIsMenuOpen(false); }}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest border-2 transition-all ${currency === cur ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white bg-white dark:bg-zinc-950'}`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timezone</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Africa/Addis_Ababa', label: 'EAT (Addis Ababa)' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'EST (New York)' },
                  { value: 'Europe/London', label: 'GMT (London)' },
                  { value: 'Asia/Dubai', label: 'GST (Dubai)' }
                ].map(tz => (
                  <button 
                    key={tz.value}
                    onClick={() => { setTimezone(tz.value); setIsMenuOpen(false); }}
                    className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 transition-all truncate ${timezone === tz.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white bg-white dark:bg-zinc-950'}`}
                  >
                    {tz.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'instructor' ? '/instructor/courses' : '/dashboard'}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-gray-900 dark:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-900/20"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon className="h-4 w-4" />
                  {user.role === 'admin' ? t('nav.admin_dashboard') : t('nav.learning_dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-black uppercase tracking-widest text-xs border border-red-100 dark:border-red-900/20"
                >
                  <LogOut className="h-4 w-4" /> {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="w-full py-4 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-center" onClick={() => setIsMenuOpen(false)}>{t('nav.login')}</Link>
                <Link to="/register" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-center shadow-xl shadow-indigo-600/30" onClick={() => setIsMenuOpen(false)}>{t('nav.register')}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
