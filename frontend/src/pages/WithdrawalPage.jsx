import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Wallet, CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import BASE_URL from '../api/config';

const WithdrawalPage = () => {
  const { user } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success, error
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/stats/instructor`, config);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/withdrawals/my`, config);
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      };

      const { data } = await axios.post(
        `${BASE_URL}/withdrawals`,
        { amount: Number(amount), bankName, accountNumber },
        config
      );

      setMessage(data.message || 'Withdrawal request submitted successfully!');
      setMessageType('success');
      setAmount('');
      setBankName('');
      setAccountNumber('');
      fetchWithdrawals();
      fetchStats();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit withdrawal request');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (!user || user.role !== 'instructor') {
    return <div className="max-w-4xl mx-auto px-4 py-12">Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/instructor/courses" 
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Withdrawal Requests
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mt-2">
            Request a withdrawal from your earnings balance
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">Available Balance</p>
              <p className="text-4xl font-black">ETB {stats?.balance?.toLocaleString() || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <p className="text-xs text-white/70 mb-1">Total Revenue</p>
              <p className="text-xl font-bold">ETB {stats?.totalRevenue?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-xs text-white/70 mb-1">Platform Fee ({stats?.platformCommissionPercentage || 20}%)</p>
              <p className="text-xl font-bold">ETB {((stats?.totalRevenue || 0) * (stats?.platformCommissionPercentage || 20) / 100).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-white/70 mb-1">Total Withdrawn</p>
              <p className="text-xl font-bold">ETB {stats?.totalWithdrawn?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-xs text-white/70 mb-1">Pending Requests</p>
              <p className="text-xl font-bold">{stats?.pendingWithdrawals || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Request Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">New Withdrawal</h2>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                messageType === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Amount (ETB)
                </label>
                <input
                  type="number"
                  required
                  min={stats?.minimumWithdrawalAmount || 500}
                  max={stats?.balance || 0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: ETB {stats?.minimumWithdrawalAmount?.toLocaleString() || 500} | Maximum: ETB {stats?.balance?.toLocaleString() || 0}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="e.g., Commercial Bank of Ethiopia"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Enter account number"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !stats?.balance || stats?.balance <= 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Processing...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Withdrawal History */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-zinc-800">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Withdrawal History</h2>
            
            {withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {withdrawals.map((withdrawal) => (
                  <div 
                    key={withdrawal._id} 
                    className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                          ETB {withdrawal.amount?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(withdrawal.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Bank:</span> {withdrawal.bankName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Account:</span> {withdrawal.accountNumber}
                      </p>
                      {withdrawal.processedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Processed on {new Date(withdrawal.processedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;
