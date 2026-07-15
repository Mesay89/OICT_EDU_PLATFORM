import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import BASE_URL from '../api/config';
import { useTheme } from '../context/ThemeContext';

const getPostAuthRoute = (nextUser) => {
  if (nextUser?.role === 'superAdmin' || nextUser?.role === 'admin') return '/admin-dashboard';
  if (nextUser?.role === 'cashManager') return '/cash-manager-dashboard';
  if (nextUser?.role === 'instructor') return '/instructor/courses';
  return '/dashboard';
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [sendingAppeal, setSendingAppeal] = useState(false);
  const [appealSent, setAppealSent] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Clear form when navigating to this page (e.g., clicking Sign In on navbar)
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
    setIsSuspended(false);
    setAppealSent(false);
  }, [location.key]);

  const handleAppeal = async () => {
    setSendingAppeal(true);
    try {
      await axios.post(`${BASE_URL}/users/request-appeal`, { email: email.trim() });
      setAppealSent(true);
    } catch (err) {
      setError('Failed to send appeal. Please try again later.');
    } finally {
      setSendingAppeal(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const normalizedEmail = email.trim();
      const { data } = await axios.post(`${BASE_URL}/users/login`, { email: normalizedEmail, password }, config);
      login(data);
      navigate(getPostAuthRoute(data));
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isSuspended) {
        setIsSuspended(true);
        setError('');
      } else if (!err.response) {
        setIsSuspended(false);
        setError('Unable to reach the server. Please check your connection and try again.');
      } else if (err.response.status >= 500) {
        setIsSuspended(false);
        setError('Server error. Please try again in a moment.');
      } else {
        setIsSuspended(false);
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative"
      style={{
        backgroundImage: "url('/images/login_bgi.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Light overlay for better form visibility - Reduced opacity for better background visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 dark:from-zinc-950/50 dark:via-indigo-950/50 dark:to-zinc-950/50"></div>
       
      <div className="max-w-md w-full space-y-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-1 rounded-2xl shadow-2xl relative z-10">
        {/* Enhanced solid background for maximum text readability */}
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-xl transition-colors duration-300 shadow-inner" style={{ opacity: 1 }}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-[32px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">Welcome back</h2>
            <p className="mt-2 text-[16px] font-bold leading-[1.5] text-gray-600 dark:text-gray-300">
              Please sign in to your account
            </p>
          </div>
          
          {error && <div className="mt-4 bg-red-100 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg text-[16px] font-bold leading-[1.5]">{error}</div>}
          
          {isSuspended && !appealSent && (
             <div className="mt-4 bg-red-100 dark:bg-red-900/40 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg text-[16px] font-bold leading-[1.5]">
                Your account has been suspended by an administrator. To appeal, please contact:{' '}
                <button 
                   type="button"
                   onClick={handleAppeal}
                   disabled={sendingAppeal}
                   className="font-bold underline hover:text-red-800 dark:hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                   {sendingAppeal ? 'Sending message...' : 'mesayboja3@gmail.com'}
                </button>
             </div>
          )}

          {appealSent && (
             <div className="mt-4 bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 p-4 rounded-lg text-[16px] font-bold leading-[1.5]">
                Your appeal message has been delivered to the admin successfully! Please check your email later for a response.
             </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={submitHandler}>
            <div className="space-y-4">
              <div>
                <label className="block text-[16px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-1">Email address</label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  spellCheck={false}
                  className="mt-1 appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 placeholder-gray-400 dark:placeholder-zinc-400 text-[#111827] dark:text-[#F9FAFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-[16px] font-bold leading-[1.5] transition-colors"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[16px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-1">Password</label>
                <div className="relative mt-1">
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required 
                    autoComplete="current-password"
                    className="appearance-none relative block w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 placeholder-gray-400 dark:placeholder-zinc-400 text-[#111827] dark:text-[#F9FAFB] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-[16px] font-bold leading-[1.5] transition-colors" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-[16px] font-bold leading-[1.5] rounded-xl text-[#F9FAFB] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/25"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <Link to="/forgotpassword" className="text-[16px] font-bold leading-[1.5] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          
          <p className="mt-3 text-center text-[16px] leading-[1.5] text-gray-600 dark:text-gray-300 font-bold">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
