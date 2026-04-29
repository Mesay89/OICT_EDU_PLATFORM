import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Share2, Users, DollarSign, Copy, CheckCircle, Send, BookOpen, History } from 'lucide-react';
import axios from 'axios';
import BASE_URL from '../api/config';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

const AffiliateDashboard = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', amount: '' });
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${BASE_URL}/users/profile`, config);
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleCopy = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied('code');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!bankDetails.amount || bankDetails.amount <= 0) return alert('Please enter a valid amount');
    if (bankDetails.amount > profile.commissionBalance) return alert('Insufficient balance');
    
    setWithdrawing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/users/withdraw`, bankDetails, config);
      alert('Withdrawal request submitted successfully! Admin will process it soon.');
      setShowWithdraw(false);
      // Refresh profile
      const { data } = await axios.get(`${BASE_URL}/users/profile`, config);
      setProfile(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-indigo-600 font-bold">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-[70vh]">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black  text-purple-600 mb-4 dark:amber-500 mb-4 ">Affiliate Hub</h1>
        <p className="text-black-500 dark:text-black-400 max-w-xl mx-auto">
          Share your referral code with friends. They get a great learning experience, and you earn 10% cash commission on every sale they make!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Referral Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
            <Share2 className="w-48 h-48 rotate-12" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2">Invite Friends</h2>
            <p className="text-indigo-100 mb-6 text-sm">
              Ask your friends to use your code or simply share your personal link.
            </p>
            
            <div className="space-y-4">
              {/* Code Box */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 block">Your Code</label>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/20">
                  <div className="flex-1 font-mono text-xl font-black tracking-widest">
                    {profile?.referralCode || 'N/A'}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(profile.referralCode);
                      setCopied('code');
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="bg-white text-indigo-600 p-2 rounded-lg hover:scale-105 transition-all shadow-md"
                  >
                    {copied === 'code' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Link Box & Telegram Share */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 block">Your Personal Link</label>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/20">
                  <div className="flex-1 text-xs font-medium truncate opacity-80">
                    {`${window.location.origin}/register?ref=${profile?.referralCode || ''}`}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/register?ref=${profile?.referralCode || ''}`;
                        navigator.clipboard.writeText(link);
                        setCopied('link');
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      title="Copy Link"
                      className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-400 transition-all shadow-md"
                    >
                      {copied === 'link' ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/register?ref=${profile?.referralCode || ''}`;
                        const text = `Hey! Join me on OICT TUTOR and start learning today. Use my link to sign up:`;
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      title="Share to Telegram"
                      className="bg-sky-500 text-white p-2 rounded-lg hover:bg-sky-400 transition-all shadow-md"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {copied && <div className="mt-4 text-center text-emerald-300 font-bold text-xs animate-pulse">Copied {copied}!</div>}
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-rows-2 gap-8">
          
          <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-8 border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <DollarSign className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Total Earnings</p>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                  {formatPrice(profile?.commissionBalance || 0, true).formatted}
                </h3>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  navigate('/courses?intent=use_balance');
                }}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" /> Purchase Course Now
              </button>
              <button 
                onClick={() => setShowWithdraw(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs opacity-80 hover:opacity-100"
              >
                Withdraw to Bank
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border dark:border-zinc-800 animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Withdraw Funds</h2>
            <p className="text-gray-500 mb-8 font-medium">Transfer your earnings to your bank account.</p>
            
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bank Name / Method (e.g. CBE, Telebirr)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Bank or Telebirr"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account Number / Phone</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter Account Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Amount to Withdraw (ETB)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="0.00"
                  value={bankDetails.amount}
                  onChange={(e) => setBankDetails({...bankDetails, amount: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white text-xl font-black text-indigo-600"
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={withdrawing || !bankDetails.amount || Number(bankDetails.amount) > (profile?.commissionBalance || 0)}
                  className={`flex-[2] py-4 rounded-2xl font-black transition-all shadow-lg ${
                    withdrawing || !bankDetails.amount || Number(bankDetails.amount) > (profile?.commissionBalance || 0)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
                >
                  {withdrawing ? 'Processing...' : 
                   Number(bankDetails.amount) > (profile?.commissionBalance || 0) ? 'Insufficient Balance' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-12 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b dark:border-zinc-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest">Recent Referral Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Your Earning</th>
              </tr>
            </thead>
            <tbody>
              {profile?.referrals?.map((ref, index) => (
                <tr key={index} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold dark:text-gray-200">{ref.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{new Date(ref.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                      Purchased
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400">
                    {formatPrice(ref.commissionAmount || 0, true).formatted}
                  </td>
                </tr>
              ))}
              {!profile?.referrals?.length && (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-gray-500 font-medium italic">No recent activity. Share your link to start earning!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> How It Works
        </h3>
        <ol className="list-decimal list-inside space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <li>Copy your unique referral code from the card above.</li>
          <li>Share it with friends, family, or on social media.</li>
          <li>When someone registers using your code, they are linked to your profile.</li>
          <li>Every time they purchase a paid course, 10% of the course price is added to your Total Earnings.</li>
        </ol>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
