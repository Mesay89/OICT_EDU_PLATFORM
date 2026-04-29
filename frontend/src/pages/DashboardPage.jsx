import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTimezone } from '../context/TimezoneContext';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import BASE_URL from '../api/config';
import InstructorStatusNotification from '../components/InstructorStatusNotification';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const { formatPrice } = useCurrency();
  const { formatDate } = useTimezone();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [activeDashboardTab, setActiveDashboardTab] = useState('courses'); // 'courses', 'payments', 'settings'
  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(null); // stores payment object
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'active', 'dropped'
  const itemsPerPage = 6;

  const filteredEnrollments = enrollments.filter(e => {
    if (filterStatus === 'all') return e.status !== 'dropped';
    return e.status === filterStatus;
  });

  useEffect(() => {
    setPage(1);
    setTotalPages(Math.ceil(filteredEnrollments.length / itemsPerPage) || 1);
  }, [filterStatus, enrollments]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get(`${BASE_URL}/enrollments/myenrollments`, config);
        setEnrollments(data);
      } catch (error) {
        console.error('Error fetching enrollments', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEnrollments();
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/payments/my-payments`, config);
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments', error);
    }
  };

  const handleRefundRequest = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) return alert('Please provide a reason');
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/payments/${showRefundModal._id}/refund-request`, { reason: refundReason }, config);
      alert('Refund request submitted!');
      setShowRefundModal(null);
      setRefundReason('');
      fetchPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit refund request');
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (window.confirm('Are you sure you want to remove this course from your dashboard?')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        await axios.delete(`${BASE_URL}/enrollments/${enrollmentId}`, config);
        // Mark as dropped in UI state
        setEnrollments(enrollments.map(env => 
          env._id === enrollmentId ? { ...env, status: 'dropped' } : env
        ));
      } catch (error) {
        console.error('Error deleting enrollment:', error);
        alert('Failed to remove course from dashboard');
      }
    }
  };

  const handleExportData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` }, responseType: 'blob' };
      const response = await axios.get(`${BASE_URL}/users/export`, config);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-data-${user._id}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`${BASE_URL}/users/delete-account`, config);
        alert('Account successfully deleted.');
        localStorage.removeItem('user');
        window.location.href = '/';
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  if (!user) return <div className="p-8 text-center text-xl text-gray-500">Please sign in to view your dashboard.</div>;

  // INSTRUCTOR-SPECIFIC VIEW
  if (user.role === 'instructor') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 border-b-2 border-indigo-500 pb-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border dark:border-zinc-800">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Welcome back, {user.name}!</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
            Manage your courses and inspire students worldwide.
          </p>
        </div>
        
        <InstructorStatusNotification />

        <div className="mt-16 flex flex-col items-center justify-center p-12 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[40px] border-2 border-dashed border-indigo-100 dark:border-indigo-800/30">
          <Link 
            to="/instructor/courses" 
            className="group relative inline-flex items-center justify-center px-12 sm:px-20 py-8 sm:py-10 text-3xl sm:text-4xl font-black text-white bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-600/30 hover:-translate-y-2 hover:shadow-indigo-600/50 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
            <span className="relative flex items-center gap-6">
              <PlayCircle className="w-12 h-12 animate-pulse" /> 
              <span>ENTER COMMAND CENTER</span>
            </span>
          </Link>
          <p className="mt-8 text-gray-500 font-bold uppercase tracking-widest text-sm">Access Your Instructor Dashboard</p>
        </div>
      </div>
    );
  }

  // ADMIN-SPECIFIC VIEW
  if (user.role === 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 border-b-2 border-purple-500 pb-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Welcome back, {user.name}!</h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
            Manage your platform, users, and content from the admin dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-600/20">
            <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Platform Role</div>
            <div className="text-3xl font-black">Administrator</div>
            <p className="text-sm opacity-70 mt-2">Full access to all system features</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
            <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">User Management</div>
            <div className="text-3xl font-black">Users & Roles</div>
            <p className="text-sm opacity-70 mt-2">Manage students & instructors</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white shadow-lg shadow-amber-600/20">
            <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Content Review</div>
            <div className="text-3xl font-black">Course Approvals</div>
            <p className="text-sm opacity-70 mt-2">Review & approve new courses</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-6 text-white shadow-lg shadow-rose-600/20">
            <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">System Health</div>
            <div className="text-3xl font-black">Monitoring</div>
            <p className="text-sm opacity-70 mt-2">Payments, refunds & analytics</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-12 bg-purple-50/50 dark:bg-purple-900/10 rounded-[40px] border-2 border-dashed border-purple-100 dark:border-purple-800/30">
          <Link 
            to="/admin-dashboard" 
            className="group relative inline-flex items-center justify-center px-12 sm:px-20 py-8 sm:py-10 text-3xl sm:text-4xl font-black text-white bg-gradient-to-br from-purple-600 via-indigo-700 to-indigo-800 rounded-[40px] overflow-hidden shadow-2xl shadow-purple-600/30 hover:-translate-y-2 hover:shadow-purple-600/50 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
            <span className="relative flex items-center gap-6">
              <PlayCircle className="w-12 h-12 animate-pulse" /> 
              <span>ENTER ADMIN DASHBOARD</span>
            </span>
          </Link>
          <p className="mt-8 text-gray-500 font-bold uppercase tracking-widest text-sm">Full Platform Control Center</p>
        </div>
      </div>
    );
  }

  // STUDENT VIEW (Default)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b-2 border-indigo-600 pb-6 bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-md">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Welcome back, {user.name}!</h1>
        <p className="mt-3 text-lg text-gray-700 dark:text-gray-300 font-semibold">
          Continue your learning journey and track your progress.
        </p>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => setFilterStatus('all')} 
            aria-pressed={filterStatus === 'all'}
            className={`cursor-pointer text-left bg-indigo-50 dark:bg-indigo-900/20 border-2 p-6 rounded-xl flex flex-col justify-center items-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-indigo-200 outline-none ${filterStatus === 'all' ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-200 dark:ring-indigo-800 scale-105' : 'border-indigo-100 dark:border-indigo-800 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1'}`}
          >
            <span className="text-lg font-bold tracking-wide text-indigo-800 dark:text-indigo-400">Total Enrolled</span>
            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-300 mt-2">
              {enrollments.filter(e => e.status !== 'dropped').length}
            </span>
            <div className="flex gap-4 mt-3 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-zinc-950 px-3 py-1 rounded-full shadow-sm border border-indigo-100 dark:border-indigo-800">
              <span>Free: {enrollments.filter(e => e.status !== 'dropped' && e.course?.price === 0).length}</span>
              <span>•</span>
              <span>Paid: {enrollments.filter(e => e.status !== 'dropped' && e.course?.price > 0).length}</span>
            </div>
          </button>
          
          <button 
            onClick={() => setFilterStatus('completed')} 
            aria-pressed={filterStatus === 'completed'}
            className={`cursor-pointer text-left bg-emerald-50 dark:bg-emerald-900/20 border-2 p-6 rounded-xl flex flex-col justify-center items-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-emerald-200 outline-none ${filterStatus === 'completed' ? 'border-emerald-500 shadow-xl ring-4 ring-emerald-200 dark:ring-emerald-800 scale-105' : 'border-emerald-100 dark:border-emerald-800 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1'}`}
          >
            <span className="text-lg font-bold tracking-wide text-emerald-800 dark:text-emerald-400">Completed</span>
            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-300 mt-2">
              {enrollments.filter(e => e.status === 'completed').length}
            </span>
          </button>

          <button 
            onClick={() => setFilterStatus('active')} 
            aria-pressed={filterStatus === 'active'}
            className={`cursor-pointer text-left bg-amber-50 dark:bg-amber-900/20 border-2 p-6 rounded-xl flex flex-col justify-center items-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-amber-200 outline-none ${filterStatus === 'active' ? 'border-amber-500 shadow-xl ring-4 ring-amber-200 dark:ring-amber-800 scale-105' : 'border-amber-100 dark:border-amber-800 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1'}`}
          >
            <span className="text-lg font-bold tracking-wide text-amber-800 dark:text-amber-400">In Progress</span>
            <span className="text-4xl font-black text-amber-600 dark:text-amber-300 mt-2">
              {enrollments.filter(e => e.status === 'active').length}
            </span>
          </button>

          <button 
            onClick={() => setFilterStatus('dropped')} 
            aria-pressed={filterStatus === 'dropped'}
            className={`cursor-pointer text-left bg-red-50 dark:bg-red-900/20 border-2 p-6 rounded-xl flex flex-col justify-center items-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-red-200 outline-none ${filterStatus === 'dropped' ? 'border-red-500 shadow-xl ring-4 ring-red-200 dark:ring-red-800 scale-105' : 'border-red-100 dark:border-red-800 hover:border-red-400 hover:shadow-lg hover:-translate-y-1'}`}
          >
            <span className="text-lg font-bold tracking-wide text-red-800 dark:text-red-400">Removed</span>
            <span className="text-4xl font-black text-red-600 dark:text-red-300 mt-2">
              {enrollments.filter(e => e.status === 'dropped').length}
            </span>
          </button>
        </div>
      )}

      {/* Modern Dashboard Tabs - Scrollable on mobile */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar border-b dark:border-zinc-800 mb-8">
        <div className="flex gap-8 min-w-max">
          <button 
            onClick={() => setActiveDashboardTab('courses')}
            aria-label="View My Courses"
            className={`pb-4 px-2 font-black text-xs sm:text-sm uppercase tracking-widest transition-all relative outline-none focus-visible:text-indigo-600 ${activeDashboardTab === 'courses' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            My Courses
            {activeDashboardTab === 'courses' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full animate-in slide-in-from-bottom-1"></div>}
          </button>
          <button 
            onClick={() => setActiveDashboardTab('payments')}
            aria-label="View Payment History"
            className={`pb-4 px-2 font-black text-xs sm:text-sm uppercase tracking-widest transition-all relative outline-none focus-visible:text-indigo-600 ${activeDashboardTab === 'payments' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            Payment History
            {activeDashboardTab === 'payments' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full animate-in slide-in-from-bottom-1"></div>}
          </button>
          <button 
            onClick={() => setActiveDashboardTab('settings')}
            aria-label="View Settings and Privacy"
            className={`pb-4 px-2 font-black text-xs sm:text-sm uppercase tracking-widest transition-all relative outline-none focus-visible:text-indigo-600 ${activeDashboardTab === 'settings' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            Settings & Privacy
            {activeDashboardTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full animate-in slide-in-from-bottom-1"></div>}
          </button>
        </div>
      </div>

      {activeDashboardTab === 'courses' ? (
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 pb-4 border-b-4 border-indigo-500 bg-white dark:bg-zinc-900 p-6 rounded-lg gap-4 shadow-md">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
            {user.role === 'instructor' ? 'My Published Courses' : 'My Enrolled Courses'}
          </h2>
          {enrollments.length > 0 && (
            <Link to="/courses" className="px-6 py-3 bg-indigo-600 text-white font-extrabold rounded-lg hover:bg-indigo-700 transition shadow-md whitespace-nowrap">
              Browse More Courses
            </Link>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-semibold">Loading your enrolled courses...</p>
            </div>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-8 text-center border overflow-hidden">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No {filterStatus === 'all' ? 'active' : filterStatus} enrollments</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filterStatus === 'dropped' ? "You haven't removed any courses." : "You haven't enrolled in any courses in this category yet."}
            </p>
            {filterStatus !== 'dropped' && (
              <Link to="/courses" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Browse Catalog
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrollments.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((env) => (
                <div key={env._id} className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-md transition">
                  {!env.course ? (
                    <div className="p-6 text-center">
                      <p className="text-red-500 font-bold">Course no longer available</p>
                      <button 
                         onClick={() => handleDeleteEnrollment(env._id)}
                         className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
                      >
                        Remove from Dashboard
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="h-48 bg-gray-200 relative">
                        <img src={env.course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} alt={env.course.title} loading="lazy" className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase">
                          <span className={env.course.price === 0 ? 'text-emerald-600' : 'text-indigo-600'}>
                            {env.course.price === 0 ? 'Free' : 'Paid'}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{env.course.title}</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-zinc-700 mb-4 mt-4">
                          <div className={`h-2.5 rounded-full ${env.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${env.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                          <span>{env.progress}% Complete</span>
                          <span className={`capitalize font-semibold ${env.status === 'dropped' ? 'text-red-500' : env.status === 'completed' ? 'text-emerald-500' : 'text-indigo-500'}`}>{env.status}</span>
                        </div>
                        
                        {env.status === 'dropped' ? (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-semibold rounded-lg text-center border border-red-100 dark:border-red-800/30">
                            Removed on: {formatDate(env.updatedAt)}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => navigate(`/player/${env.course._id}`)}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition font-bold ${env.status === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                              <PlayCircle className="w-4 h-4" /> {env.status === 'completed' ? 'Review Content' : 'Continue Learning'}
                            </button>
                            <button 
                              onClick={() => handleDeleteEnrollment(env._id)}
                              className="px-3 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-100 transition font-medium text-sm"
                              title="Remove from dashboard"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button 
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-4 py-2 rounded-lg transition ${
                      page === p 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      ) : activeDashboardTab === 'payments' ? (
        /* PAYMENTS TAB */
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <h2 className="text-3xl font-black mb-8">Purchase History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b dark:border-zinc-800">
                  <th className="pb-4">Item</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Method</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {payments.map((pay) => (
                  <tr key={pay._id} className="text-sm font-medium">
                    <td className="py-6">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {pay.course?.title || 'Course Access'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{pay.transactionId}</div>
                    </td>
                    <td className="py-6 text-gray-600 dark:text-gray-400">
                      {formatDate(pay.createdAt)}
                    </td>
                    <td className="py-6 font-black text-indigo-600">
                      {formatPrice(pay.amount).formatted}
                    </td>
                    <td className="py-6 uppercase text-xs font-black text-gray-500">
                      {pay.paymentMethod}
                    </td>
                    <td className="py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        pay.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pay.status}
                      </span>
                      {pay.refundStatus !== 'none' && (
                        <div className={`mt-1 text-[10px] font-black uppercase ${
                          pay.refundStatus === 'requested' ? 'text-amber-600' : 
                          pay.refundStatus === 'approved' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          Refund: {pay.refundStatus}
                        </div>
                      )}
                    </td>
                    <td className="py-6">
                      {pay.status === 'completed' && pay.refundStatus === 'none' && (
                        <button 
                          onClick={() => setShowRefundModal(pay)}
                          className="text-xs font-black text-red-500 hover:text-red-600 underline"
                        >
                          Request Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                No payment history found
              </div>
            )}
          </div>
        </div>
      ) : activeDashboardTab === 'settings' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <h2 className="text-3xl font-black mb-8">Settings & Privacy</h2>
          <div className="space-y-8 max-w-2xl">
            <div className="bg-gray-50 dark:bg-zinc-950 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800">
              <h3 className="text-xl font-bold mb-2">Export Data (GDPR)</h3>
              <p className="text-gray-500 mb-4 text-sm font-medium">Download a copy of your personal data stored on our platform.</p>
              <button 
                onClick={handleExportData}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md"
              >
                Download My Data
              </button>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-red-500/80 mb-4 text-sm font-medium">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button 
                onClick={handleDeleteAccount}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-300">
             <h3 className="text-3xl font-black mb-4">Request Refund</h3>
             <p className="text-gray-500 mb-8 font-medium">
               You are requesting a refund for <span className="text-indigo-600">"{showRefundModal.course?.title}"</span>. Refunds are only processed within 14 days of purchase.
             </p>
             <form onSubmit={handleRefundRequest}>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Reason for refund</label>
               <textarea 
                 className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                 placeholder="Tell us why you are requesting a refund..."
                 value={refundReason}
                 onChange={(e) => setRefundReason(e.target.value)}
                 required
               />
               <div className="flex gap-4 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setShowRefundModal(null)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                  >
                    Submit Request
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
