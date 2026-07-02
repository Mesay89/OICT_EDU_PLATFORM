import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import BASE_URL from '../api/config';
import { 
  DollarSign, 
  CreditCard, 
  ArrowDownCircle, 
  Activity,
  Users,
  BarChart3,
  RefreshCw,
  Wallet,
  Tag,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  X,
  AlertTriangle,
  BookOpen,
  User
} from 'lucide-react';

const CashManagerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // States for different tabs
  const [dashboardData, setDashboardData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [reports, setReports] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentRejectionReason, setPaymentRejectionReason] = useState('');
  const [showPaymentRejectInput, setShowPaymentRejectInput] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    minimumWithdrawalAmount: 500,
    maximumWithdrawalAmount: 10000,
    dailyWithdrawalLimit: 50000,
    currency: 'ETB',
    platformCommissionPercentage: 10
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user && user.role === 'cashManager') {
      fetchData();
      fetchSettings();
    }
  }, [user, activeTab]);

  const fetchSettings = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/settings`, config);
      if (data) {
        setSettings({
          minimumWithdrawalAmount: data.minimumWithdrawalAmount || 500,
          maximumWithdrawalAmount: data.maximumWithdrawalAmount || 10000,
          dailyWithdrawalLimit: data.dailyWithdrawalLimit || 50000,
          currency: data.currency || 'ETB',
          platformCommissionPercentage: data.platformCommissionPercentage ?? 10
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/settings`, settings, config);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      if (activeTab === 'overview') {
        const { data } = await axios.get(`${BASE_URL}/cash-manager/dashboard`, config);
        setDashboardData(data);
      } else if (activeTab === 'payments') {
        const { data } = await axios.get(`${BASE_URL}/cash-manager/payments`, config);
        setPayments(data);
      } else if (activeTab === 'withdrawals') {
        const { data } = await axios.get(`${BASE_URL}/cash-manager/withdrawals`, config);
        setWithdrawals(data);
      } else if (activeTab === 'refunds') {
        const { data } = await axios.get(`${BASE_URL}/cash-manager/refunds`, config);
        setRefunds(data);
      } else if (activeTab === 'coupons') {
        const { data } = await axios.get(`${BASE_URL}/cash-manager/coupons`, config);
        setCoupons(data);
      } else if (activeTab === 'reports') {
        const { data } = await axios.get(`${BASE_URL}/cash-manager/reports`, config);
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this withdrawal as ${status}?`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/cash-manager/withdrawals/${id}/process`, { status, reason: 'Processed by Cash Manager' }, config);
      fetchData();
      alert(`Withdrawal ${status} successfully!`);
    } catch (error) {
      alert('Error processing withdrawal: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProcessRefund = async (refundStatus) => {
    if (!selectedRefund) return;
    if (refundStatus === 'rejected' && !rejectionReason.trim()) {
      alert('Please enter a reason for rejection.');
      return;
    }
    setProcessingRefund(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/cash-manager/refunds/${selectedRefund._id}/process`, { refundStatus, rejectionReason }, config);
      setSelectedRefund(null);
      setRejectionReason('');
      setShowRejectInput(false);
      fetchData();
      alert(`Refund ${refundStatus === 'approved' ? 'approved ✅' : 'rejected ❌'} and student notified!`);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingRefund(false);
    }
  };

  const openRefundModal = (refund) => {
    setSelectedRefund(refund);
    setRejectionReason('');
    setShowRejectInput(false);
  };

  const handleProcessPayment = async (status) => {
    if (!selectedPayment) return;
    if (status === 'reject' && !paymentRejectionReason.trim()) {
      alert('Please enter a reason for rejection.');
      return;
    }
    setProcessingPayment(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const endpoint = status === 'approve' ? 'approve' : 'reject';
      await axios.put(`${BASE_URL}/cash-manager/payments/${selectedPayment._id}/${endpoint}`, { reason: paymentRejectionReason }, config);
      setSelectedPayment(null);
      setPaymentRejectionReason('');
      setShowPaymentRejectInput(false);
      fetchData();
      alert(`Payment ${status === 'approve' ? 'approved ✅' : 'rejected ❌'} and student notified!`);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingPayment(false);
    }
  };

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentRejectionReason('');
    setShowPaymentRejectInput(false);
  };

  if (!user || user.role !== 'cashManager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">Unauthorized Access</h2>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'refunds', label: 'Refunds', icon: RefreshCw },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'settings', label: 'Settings', icon: BookOpen },
  ];

  const filteredPayments = payments.filter(p => 
    p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Cash Manager Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Financial overview and payment management</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto space-x-4 mb-8 pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:border-indigo-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && dashboardData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 mb-4"><DollarSign className="w-6 h-6" /></div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Today's Revenue</p>
                    <h3 className="text-2xl font-bold">{dashboardData.currency || settings.currency} {dashboardData.stats.todaysRevenue?.toLocaleString() || 0}</h3>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 mb-4"><Activity className="w-6 h-6" /></div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Monthly Revenue</p>
                    <h3 className="text-2xl font-bold">{dashboardData.currency || settings.currency} {dashboardData.stats.monthlyRevenue?.toLocaleString() || 0}</h3>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 mb-4"><Wallet className="w-6 h-6" /></div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pending Withdrawals</p>
                    <h3 className="text-2xl font-bold">{dashboardData.stats.pendingWithdrawals || 0}</h3>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center text-pink-600 mb-4"><RefreshCw className="w-6 h-6" /></div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pending Refunds</p>
                    <h3 className="text-2xl font-bold">{dashboardData.stats.pendingRefunds || 0}</h3>
                  </div>
                </div>

                {/* Lifetime Revenue + Platform/Instructor Fee breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-200 mb-2">💰 Lifetime Revenue</p>
                    <h1 className="text-3xl font-black">{(dashboardData.stats.totalRevenue || 0).toLocaleString()} <span className="text-lg font-bold text-violet-200">{dashboardData.currency || settings.currency}</span></h1>
                    <p className="text-violet-300 text-xs mt-2">Gross revenue from all completed transactions</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-2">🏦 Platform Fee ({dashboardData.stats.platformCommissionPct ?? settings.platformCommissionPercentage}%)</p>
                    <h1 className="text-3xl font-black">{(dashboardData.stats.platformFee || 0).toLocaleString()} <span className="text-lg font-bold text-emerald-200">{dashboardData.currency || settings.currency}</span></h1>
                    <p className="text-emerald-100 text-xs mt-2">Platform's share at {dashboardData.stats.platformCommissionPct ?? settings.platformCommissionPercentage}% commission</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-100 mb-2">👨‍🏫 Instructor Payout ({dashboardData.stats.instructorCommissionPct ?? (100 - settings.platformCommissionPercentage)}%)</p>
                    <h1 className="text-3xl font-black">{(dashboardData.stats.instructorFee || 0).toLocaleString()} <span className="text-lg font-bold text-amber-200">{dashboardData.currency || settings.currency}</span></h1>
                    <p className="text-amber-100 text-xs mt-2">Instructors' share at {dashboardData.stats.instructorCommissionPct ?? (100 - settings.platformCommissionPercentage)}% commission</p>
                  </div>
                </div>

                {dashboardData.stats.instructorRevenueBreakdown && dashboardData.stats.instructorRevenueBreakdown.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Instructor Revenue Breakdown</h2>
                    <p className="text-sm text-gray-500 mb-6">Total revenue generated by each instructor from their courses.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Instructor</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Total Revenue</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Payments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {dashboardData.stats.instructorRevenueBreakdown.map((instructor, index) => (
                            <tr key={instructor.instructorId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <p className="font-bold text-sm">{instructor.instructorName}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{instructor.instructorEmail}</td>
                              <td className="px-6 py-4 font-bold text-emerald-600">ETB {instructor.totalRevenue?.toLocaleString() || 0}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{instructor.paymentCount || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Payments</h2>
                  <div className="relative w-64">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search transactions..." 
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User / Course</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {filteredPayments.map(payment => (
                        <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                          <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{payment.transactionId}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{payment.user?.name}</p>
                            <p className="text-xs text-gray-500">{payment.course?.title || payment.bundle?.title || 'Unknown Item'}</p>
                          </td>
                          <td className="px-6 py-4 font-bold">{payment.currency} {payment.amount}</td>
                          <td className="px-6 py-4 uppercase text-xs">{payment.paymentMethod}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-lg font-bold ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                              (payment.status === 'pending' || payment.status === 'pending_approval') ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>{payment.status}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openPaymentModal(payment)}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                              {(payment.status === 'pending' || payment.status === 'pending_approval') ? 'Review' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAYMENT DETAIL MODAL */}
            {selectedPayment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">Payment Details</h2>
                      <p className="text-sm text-gray-500">Review the payment information</p>
                    </div>
                    <button
                      onClick={() => { setSelectedPayment(null); setShowPaymentRejectInput(false); setPaymentRejectionReason(''); }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase ${
                          selectedPayment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          (selectedPayment.status === 'pending' || selectedPayment.status === 'pending_approval') ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{selectedPayment.status}</span>
                        <span className="text-xs text-gray-400">Date: {new Date(selectedPayment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-mono text-gray-500">TXN: {selectedPayment.transactionId}</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1"><User className="w-3 h-3"/> Student Info</p>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedPayment.user?.name}</p>
                      <p className="text-sm text-gray-500">{selectedPayment.user?.email}</p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4">
                      <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Course/Bundle Information</p>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedPayment.course?.title || selectedPayment.bundle?.title || 'Unknown Item'}</p>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Amount Paid ({selectedPayment.paymentMethod})</p>
                        <p className="text-3xl font-black text-emerald-600">{selectedPayment.currency} {selectedPayment.amount}</p>
                      </div>
                      <DollarSign className="w-10 h-10 text-emerald-300" />
                    </div>

                    {selectedPayment.status === 'failed' && selectedPayment.rejectionReason && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                        <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Rejection Reason</p>
                        <p className="text-gray-800 dark:text-gray-200 italic">"{selectedPayment.rejectionReason}"</p>
                      </div>
                    )}

                    {(selectedPayment.status === 'pending' || selectedPayment.status === 'pending_approval') && (
                      <div className="pt-2 space-y-3">
                        {!showPaymentRejectInput ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleProcessPayment('approve')}
                              disabled={processingPayment}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                              {processingPayment ? 'Processing...' : 'Approve Payment'}
                            </button>
                            <button
                              onClick={() => setShowPaymentRejectInput(true)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                              Reject Payment
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
                            <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> Rejection Reason — Required, will be sent to student
                            </p>
                            <textarea
                              value={paymentRejectionReason}
                              onChange={(e) => setPaymentRejectionReason(e.target.value)}
                              placeholder="Explain clearly why this payment is being rejected..."
                              rows={4}
                              className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setShowPaymentRejectInput(false); setPaymentRejectionReason(''); }}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleProcessPayment('reject')}
                                disabled={!paymentRejectionReason.trim() || processingPayment}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {processingPayment ? 'Sending...' : 'Confirm & Notify'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* WITHDRAWALS TAB */}
            {activeTab === 'withdrawals' && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Instructor Withdrawals</h2>
                  <p className="text-sm text-gray-500 mt-1">Review and process instructor payout requests.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Instructor</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Bank Details</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {withdrawals.map(w => (
                        <tr key={w._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{w.user?.name}</p>
                            <p className="text-xs text-gray-500">{w.user?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{w.bankName}</p>
                            <p className="text-xs font-mono text-gray-500">{w.accountNumber}</p>
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600">ETB {w.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-lg font-bold ${
                              w.status === 'approved' ? 'bg-green-100 text-green-700' :
                              w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>{w.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {w.status === 'pending' ? (
                              <>
                                <button onClick={() => handleProcessWithdrawal(w._id, 'approved')} className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs font-bold">Approve</button>
                                <button onClick={() => handleProcessWithdrawal(w._id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-bold">Reject</button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REFUNDS TAB */}
            {activeTab === 'refunds' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Refund Requests</h2>
                    <p className="text-sm text-gray-500 mt-1">Click <strong>Review Case</strong> to see full details before deciding.</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full">
                    {refunds.filter(r => r.refundStatus === 'requested').length} Pending
                  </span>
                </div>

                {refunds.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <RefreshCw className="w-10 h-10 mx-auto mb-4 text-gray-300" />
                    <p className="font-bold uppercase tracking-widest text-sm">No refund requests found</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {refunds.map(r => (
                      <div key={r._id} className={`bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        r.refundStatus === 'requested' ? 'border-amber-200 dark:border-amber-800' :
                        r.refundStatus === 'approved' ? 'border-emerald-200 dark:border-emerald-900' :
                        'border-red-200 dark:border-red-900'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 text-xs rounded-lg font-bold uppercase ${
                              r.refundStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              r.refundStatus === 'requested' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>{r.refundStatus}</span>
                            <span className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white truncate">{r.course?.title || 'Unknown Course'}</p>
                          <p className="text-sm text-gray-500">{r.user?.name} — <span className="font-semibold text-indigo-600">{r.currency} {r.amount}</span></p>
                          {r.refundStatus === 'rejected' && r.refundRejectionReason && (
                            <p className="text-xs text-red-500 mt-1 italic">Rejection reason: {r.refundRejectionReason}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {r.refundStatus === 'requested' ? (
                            <button
                              onClick={() => openRefundModal(r)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> Review Case
                            </button>
                          ) : (
                            <button
                              onClick={() => openRefundModal(r)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REFUND DETAIL MODAL */}
            {selectedRefund && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">Refund Case Details</h2>
                      <p className="text-sm text-gray-500">Review the full case before making a decision</p>
                    </div>
                    <button
                      onClick={() => { setSelectedRefund(null); setShowRejectInput(false); setRejectionReason(''); }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase ${
                        selectedRefund.refundStatus === 'approved' ? 'bg-green-100 text-green-700' :
                        selectedRefund.refundStatus === 'requested' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{selectedRefund.refundStatus}</span>
                      <span className="text-xs text-gray-400">Submitted: {new Date(selectedRefund.updatedAt).toLocaleString()}</span>
                    </div>

                    {/* Student Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1"><User className="w-3 h-3"/> Student</p>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedRefund.user?.name}</p>
                      <p className="text-sm text-gray-500">{selectedRefund.user?.email}</p>
                    </div>

                    {/* Course & Instructor */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4">
                      <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Course Information</p>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedRefund.course?.title}</p>
                      <p className="text-sm text-gray-500">Instructor: <span className="font-semibold">{selectedRefund.course?.instructor?.name || 'Unknown'}</span></p>
                      <p className="text-sm text-gray-500">Instructor Email: {selectedRefund.course?.instructor?.email || 'N/A'}</p>
                    </div>

                    {/* Amount */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Refund Amount Requested</p>
                        <p className="text-3xl font-black text-emerald-600">{selectedRefund.currency} {selectedRefund.amount}</p>
                      </div>
                      <DollarSign className="w-10 h-10 text-emerald-300" />
                    </div>

                    {/* Student's Reason */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                      <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> Student's Reason for Refund
                      </p>
                      <p className="text-gray-800 dark:text-gray-200 font-medium italic">"{selectedRefund.refundReason || 'No reason provided by student.'}"</p>
                    </div>

                    {/* Show rejection reason if already rejected */}
                    {selectedRefund.refundStatus === 'rejected' && selectedRefund.refundRejectionReason && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                        <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Rejection Reason Sent to Student</p>
                        <p className="text-gray-800 dark:text-gray-200 italic">"{selectedRefund.refundRejectionReason}"</p>
                      </div>
                    )}

                    {/* Actions — only if pending */}
                    {selectedRefund.refundStatus === 'requested' && (
                      <div className="pt-2 space-y-3">
                        {!showRejectInput ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleProcessRefund('approved')}
                              disabled={processingRefund}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                              {processingRefund ? 'Processing...' : 'Approve Refund'}
                            </button>
                            <button
                              onClick={() => setShowRejectInput(true)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                              Reject Refund
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
                            <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> Rejection Reason — Required, will be sent to student as notification
                            </p>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Explain clearly why this refund request is being rejected..."
                              rows={4}
                              className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setShowRejectInput(false); setRejectionReason(''); }}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleProcessRefund('rejected')}
                                disabled={!rejectionReason.trim() || processingRefund}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {processingRefund ? 'Sending...' : 'Confirm & Notify Student'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* REPORTS TAB */}
            {activeTab === 'reports' && reports && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                    <h2 className="text-xl font-bold opacity-80 mb-2">Platform Net Revenue</h2>
                    <h1 className="text-4xl font-black mb-4">ETB {reports.platformRevenue?.toLocaleString()}</h1>
                    <div className="flex justify-between items-center bg-indigo-700/50 rounded-xl p-4">
                      <div>
                        <p className="text-sm opacity-80">Platform Commission Rate</p>
                        <p className="font-bold text-xl">{reports.platformCommissionRate}%</p>
                      </div>
                      <BarChart3 className="w-8 h-8 opacity-50" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Instructor Ledger</h2>
                    <div className="space-y-4 mt-6">
                      <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
                        <span className="text-gray-500">Total Instructor Earnings</span>
                        <span className="font-bold">ETB {reports.totalInstructorEarnings?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
                        <span className="text-gray-500">Total Payouts (Approved)</span>
                        <span className="font-bold text-emerald-600">ETB {reports.totalPayouts?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Pending Balances</span>
                        <span className="font-bold text-amber-600">ETB {reports.pendingInstructorPayouts?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Performing Instructors</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-zinc-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Instructor</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Courses Sold</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Gross Sales</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Net Earnings ({(100 - reports.platformCommissionRate)}%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {reports.instructorEarnings?.map(instructor => (
                          <tr key={instructor._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                            <td className="px-6 py-4">
                              <p className="font-bold">{instructor.instructorName}</p>
                              <p className="text-xs text-gray-500">{instructor.instructorEmail}</p>
                            </td>
                            <td className="px-6 py-4">{instructor.coursesSold}</td>
                            <td className="px-6 py-4 font-mono text-sm text-gray-500">ETB {instructor.totalGross?.toLocaleString()}</td>
                            <td className="px-6 py-4 font-bold text-emerald-600">ETB {instructor.netEarnings?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* COUPONS TAB */}
            {activeTab === 'coupons' && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Discount & Coupon Monitoring</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Discount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Instructor</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Usage</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {coupons.map(coupon => (
                        <tr key={coupon._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                          <td className="px-6 py-4">
                            <span className="font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-100">{coupon.code}</span>
                          </td>
                          <td className="px-6 py-4 font-bold">
                            {coupon.discountType === 'percentage' ? `${coupon.discountAmount}%` : `ETB ${coupon.discountAmount}`}
                          </td>
                          <td className="px-6 py-4 text-sm">{coupon.instructor?.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500" 
                                  style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{coupon.usedCount} / {coupon.usageLimit}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {coupon.isActive ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Withdrawal Settings</h2>
                <p className="text-sm text-gray-500 mb-6">Configure withdrawal limits for instructors</p>
                
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Withdrawal Amount (ETB)
                    </label>
                    <input
                      type="number"
                      value={settings.minimumWithdrawalAmount}
                      onChange={(e) => setSettings({...settings, minimumWithdrawalAmount: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Smallest amount an instructor can withdraw at once</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Maximum Withdrawal Amount (ETB)
                    </label>
                    <input
                      type="number"
                      value={settings.maximumWithdrawalAmount}
                      onChange={(e) => setSettings({...settings, maximumWithdrawalAmount: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Largest amount an instructor can withdraw at once</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Daily Withdrawal Limit (ETB)
                    </label>
                    <input
                      type="number"
                      value={settings.dailyWithdrawalLimit}
                      onChange={(e) => setSettings({...settings, dailyWithdrawalLimit: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total amount an instructor can withdraw per day</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashManagerDashboard;
