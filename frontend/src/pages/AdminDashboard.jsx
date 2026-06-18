import React, { useState, useEffect } from 'react';
import { 
  Star, Users, LayoutDashboard, BookOpen, UserCheck, 
  RefreshCw, CreditCard, BarChart3, History, Settings, 
  ClipboardCheck, AlertCircle, Clock, ArrowLeft, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BASE_URL from '../api/config';

const AdminDashboard = () => {
  const { user } = useAuth();

  const getPaymentCurrency = (pay) => pay.currency || pay.course?.currency || 'ETB';
  const formatPaymentAmount = (pay) => `${Number(pay.amount).toLocaleString()} ${getPaymentCurrency(pay)}`;
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [instructorHistory, setInstructorHistory] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [courseHistory, setCourseHistory] = useState([]);
  const [pendingBundles, setPendingBundles] = useState([]);
  const [bundleHistory, setBundleHistory] = useState([]);
  const [bundleSubTab, setBundleSubTab] = useState('pending');

  const fetchPendingCourses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/courses/pending`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingCourses(data);
    } catch (error) {
      console.error('Error fetching pending courses:', error);
    }
  };

  const fetchCourseHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/courses/history`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setCourseHistory(data);
    } catch (error) {
      console.error('Error fetching course history:', error);
    }
  };

  const fetchPendingBundles = async () => {
    try {
      const response = await fetch(`${BASE_URL}/bundles/admin/pending`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingBundles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending bundles:', error);
    }
  };

  const fetchBundleHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/bundles/admin/history`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setBundleHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bundle history:', error);
    }
  };

  const handleBundleStatus = async (id, status) => {
    try {
      const response = await fetch(`${BASE_URL}/bundles/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        alert(`Bundle ${status} successfully!`);
        fetchPendingBundles();
        fetchBundleHistory();
      } else {
        const err = await response.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      console.error('Error updating bundle status:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
      fetchPendingInstructors();
      fetchAllCourses();
      fetchAllUsers();
      fetchRefundRequests();
      fetchPendingPayments();
      fetchRevenueReport();
      fetchAuditLogs();
      fetchSettings();
      fetchPendingAssignments();
      fetchWithdrawals();
      fetchAllPayments();
      fetchInstructorHistory();
      fetchAssignmentHistory();
      fetchPendingCourses();
      fetchCourseHistory();
      fetchPendingBundles();
      fetchBundleHistory();
    }
  }, [user]);

  const fetchRevenueReport = async () => {
    try {
      const response = await fetch(`${BASE_URL}/reports/revenue`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue report:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setAuditLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${BASE_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchAllPayments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/payments/all`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setAllPayments(data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/payments/pending`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleProcessPayment = async (id, status) => {
    try {
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      const response = await fetch(`${BASE_URL}/admin/payments/${id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        alert(`Payment ${status}`);
        fetchPendingPayments();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users/admin/withdrawals`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleProcessWithdrawal = async (id, status) => {
    try {
      const response = await fetch(`${BASE_URL}/users/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        alert(`Withdrawal ${status} successfully!`);
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/refunds`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setRefundRequests(data);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
    }
  };

  const handleProcessRefund = async (id, status) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/refunds/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        alert(`Refund ${status}`);
        fetchRefundRequests();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };


  const handleApproveCourse = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/courses/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        alert('Course approved and published!');
        fetchPendingCourses();
        fetchCourseHistory();
        fetchAllCourses();
      }
    } catch (error) {
      console.error('Error approving course:', error);
    }
  };

  const handleRejectCourse = async (id) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`${BASE_URL}/admin/courses/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        alert('Course rejected');
        fetchPendingCourses();
        fetchCourseHistory();
      }
    } catch (error) {
      console.error('Error rejecting course:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchPendingInstructors = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/pending-instructors`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      setPendingInstructors(data);
    } catch (error) {
      console.error('Error fetching pending instructors:', error);
    }
  };

  const fetchPendingAssignments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/lms/admin/pending-assignments`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchInstructorHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/instructors/history`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setInstructorHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching instructor history:', error);
    }
  };

  const fetchAssignmentHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/lms/admin/assignments/history`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setAssignmentHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    }
  };

  const handleUpdateAssignmentStatus = async (id, status) => {
    try {
      const response = await fetch(`${BASE_URL}/lms/assignments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        alert(`Assignment ${status}`);
        fetchPendingAssignments();
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const fetchAllCourses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setAllCourses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setAllUsers(data);
      
      // Separate users by role
      const studentUsers = data.filter(user => user.role === 'student');
      const instructorUsers = data.filter(user => user.role === 'instructor');
      const adminUsers = data.filter(user => user.role === 'admin');
      
      setStudents(studentUsers);
      setInstructors(instructorUsers);
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleApproveInstructor = async (instructorId) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/approve-instructor/${instructorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Instructor approved successfully!');
        fetchPendingInstructors();
        fetchDashboardData();
        fetchAllUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving instructor:', error);
      alert('Failed to approve instructor');
    }
  };

  const handleRejectInstructor = async (instructorId) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/reject-instructor/${instructorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Instructor rejected');
        fetchPendingInstructors();
        fetchDashboardData();
        fetchAllUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting instructor:', error);
      alert('Failed to reject instructor');
    }
  };

  const handleRevokeInstructor = async (instructorId) => {
    if (window.confirm('Are you sure you want to revoke this instructor\'s permissions?')) {
      try {
        const response = await fetch(`${BASE_URL}/admin/revoke-instructor/${instructorId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          alert('Instructor permissions revoked');
          fetchAllUsers();
          fetchPendingInstructors();
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error revoking instructor:', error);
        alert('Failed to revoke instructor permissions');
      }
    }
  };

  const handleRevokeAdmin = async (userId) => {
    if (window.confirm('Are you sure you want to revoke admin role from this user?')) {
      try {
        const response = await fetch(`${BASE_URL}/admin/revoke-admin/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          alert('Admin role revoked successfully!');
          fetchAllUsers();
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error revoking admin role:', error);
        alert('Failed to revoke admin role');
      }
    }
  };

  const handleGrantAdmin = async (userId) => {
    if (window.confirm('Are you sure you want to grant admin role to this user?')) {
      try {
        const response = await fetch(`${BASE_URL}/admin/grant-admin/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          alert('Admin role granted successfully!');
          fetchAllUsers();
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error granting admin role:', error);
        alert('Failed to grant admin role');
      }
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        alert('User suspended');
        fetchAllUsers();
        fetchAuditLogs();
      }
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/users/${userId}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        alert('User activated');
        fetchAllUsers();
        fetchAuditLogs();
      }
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };


  const handleToggleFeatured = async (courseId) => {
    // Optimistic Update
    const originalCourses = [...allCourses];
    setAllCourses(prev => prev.map(c => 
      c._id === courseId ? { ...c, isFeatured: !c.isFeatured } : c
    ));

    try {
      const response = await fetch(`${BASE_URL}/admin/courses/${courseId}/featured`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Rollback on error
        setAllCourses(originalCourses);
        const err = await response.json();
        alert(err.message || 'Failed to toggle featured status');
      } else {
        // Just refresh to be sure we have latest server state
        fetchAllCourses();
      }
    } catch (error) {
      setAllCourses(originalCourses);
      console.error('Error toggling featured:', error);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      const response = await fetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        alert('Settings updated successfully');
        fetchAuditLogs();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const response = await fetch(`${BASE_URL}/admin/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });
        
        if (response.ok) {
          alert('Course deleted successfully');
          fetchAllCourses();
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  if (user?.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-red-600 text-xl">Access Denied: Admin role required</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600 text-xl">Loading admin dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><LayoutDashboard className="h-32 w-32" /></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 opacity-80 font-medium">Control center for system management & analytics</p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-lg font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">Welcome, {user.name}</span>
          </div>
        </div>
      </div>

      {activeTab === null ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10 animate-in fade-in zoom-in duration-500">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'indigo', border: 'border-indigo-500/30' },
            { id: 'instructors', label: 'Instructors', icon: UserCheck, color: 'orange', count: pendingInstructors.length, border: 'border-orange-500/30' },
            { id: 'courses', label: 'Course Management', icon: BookOpen, color: 'purple', border: 'border-purple-500/30' },
            { id: 'users', label: 'Community', icon: Users, color: 'blue', border: 'border-blue-500/30' },
            { id: 'refunds', label: 'Refunds', icon: RefreshCw, color: 'pink', count: refundRequests.length, border: 'border-pink-500/30' },
            { id: 'payments', label: 'Payments', icon: CreditCard, color: 'emerald', count: pendingPayments.length, border: 'border-emerald-500/30' },
            { id: 'assignments', label: 'Assignments', icon: ClipboardCheck, color: 'amber', count: pendingAssignments.length, border: 'border-amber-500/30' },
            { id: 'course_approvals', label: 'Course Approval', icon: Star, color: 'yellow', count: pendingCourses.length, border: 'border-yellow-500/30' },
            { id: 'bundle_approvals', label: 'Bundle Approval', icon: BookOpen, color: 'violet', count: pendingBundles.length, border: 'border-violet-500/30' },
            { id: 'revenue', label: 'Revenue', icon: BarChart3, color: 'cyan', border: 'border-cyan-500/30' },
            { id: 'audit', label: 'Audit Logs', icon: History, color: 'zinc', border: 'border-zinc-500/30' },
            { id: 'settings', label: 'Settings', icon: Settings, color: 'slate', border: 'border-slate-500/30' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative group flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border dark:border-zinc-800 hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              >
                <div className="p-5 rounded-2xl mb-4 bg-gray-50 dark:bg-zinc-800 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-sm group-hover:shadow-indigo-500/50">
                  <Icon className="h-8 w-8" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {tab.label}
                </span>
                {tab.count > 0 && (
                  <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-900">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mb-8 animate-in slide-in-from-left duration-300 flex items-center justify-between">
          <button 
            onClick={() => setActiveTab(null)}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl font-black text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 transition-all shadow-sm group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Back to Navigation
          </button>
          <div className="text-right">
             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
               {activeTab === 'instructors' && 'Instructor Management'}
               {activeTab === 'assignments' && 'Assignments Review'}
               {activeTab === 'course_approvals' && 'Course Approval Requests'}
               {activeTab === 'overview' && 'System Overview'}
               {activeTab === 'courses' && 'Course Management'}
               {activeTab === 'users' && 'Community & Users'}
               {activeTab === 'refunds' && 'Refund Requests'}
               {activeTab === 'payments' && 'Payment History'}
               {activeTab === 'revenue' && 'Revenue Analytics'}
               {activeTab === 'audit' && 'Audit Trails'}
               {activeTab === 'settings' && 'Platform Settings'}
               {activeTab === 'bundle_approvals' && 'Bundle Approval Requests'}
             </h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Admin Control Panel</p>
          </div>
        </div>
      )}

      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Instructor Approval Requests</h2>
            {pendingInstructors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No pending instructor requests</div>
                <p className="text-gray-500 mt-2">All instructor applications have been processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInstructors.map(instructor => (
                  <div key={instructor._id} className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <h4 className="font-semibold text-lg">{instructor.name}</h4>
                      <p className="text-gray-600">{instructor.email}</p>
                      <p className="text-sm text-gray-500">Registered: {new Date(instructor.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => handleApproveInstructor(instructor._id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        onClick={() => handleRejectInstructor(instructor._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructor Approval History */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" /> Instructor Approval History
            </h2>
            {instructorHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No historical records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b dark:border-zinc-800 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="py-3 pr-4">Name</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Registered</th>
                      <th className="py-3 pr-4">Decision Date</th>
                      <th className="py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructorHistory.map(hist => (
                      <tr key={hist._id} className="border-b dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 font-bold text-gray-900 dark:text-white">{hist.name}</td>
                        <td className="py-4 text-gray-500 text-sm">{hist.email}</td>
                        <td className="py-4 text-gray-400 text-xs">{new Date(hist.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 text-gray-400 text-xs">{new Date(hist.updatedAt).toLocaleDateString()}</td>
                        <td className="py-4 text-right">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                            hist.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {hist.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assignment Approval Requests</h2>
            {pendingAssignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No pending assignment requests</div>
                <p className="text-gray-500 mt-2">All assignments have been processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAssignments.map(asn => (
                  <div key={asn._id} className="border dark:border-zinc-800 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{asn.title}</h4>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-black uppercase rounded-lg">Module {asn.module}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{asn.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <div className="flex flex-col">
                          <span className="text-gray-400 uppercase font-bold tracking-tighter">Course</span>
                          <span className="font-bold text-gray-700 dark:text-gray-200">{asn.course?.title}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 uppercase font-bold tracking-tighter">Instructor</span>
                          <span className="font-bold text-gray-700 dark:text-gray-200">{asn.instructor?.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 uppercase font-bold tracking-tighter">Max Points</span>
                          <span className="font-bold text-indigo-600">{asn.points} PTS</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-emerald-700 shadow-md transition"
                        onClick={() => handleUpdateAssignmentStatus(asn._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button 
                        className="bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-black hover:bg-red-50 transition"
                        onClick={() => handleUpdateAssignmentStatus(asn._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Approval History */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" /> Assignment Approval History
            </h2>
            {assignmentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No historical records found</div>
            ) : (
              <div className="space-y-3">
                {assignmentHistory.map(hist => (
                  <div key={hist._id} className="border dark:border-zinc-800 rounded-lg p-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">{hist.title}</h4>
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-black uppercase rounded">Module {hist.module}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                          <span><span className="font-bold text-gray-400 uppercase tracking-wider">Course:</span> {hist.course?.title}</span>
                          <span><span className="font-bold text-gray-400 uppercase tracking-wider">Instructor:</span> {hist.instructor?.name}</span>
                          <span><span className="font-bold text-gray-400 uppercase tracking-wider">Points:</span> {hist.points}</span>
                          <span><span className="font-bold text-gray-400 uppercase tracking-wider">Reviewed:</span> {new Date(hist.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                        hist.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {hist.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border dark:border-zinc-800">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Users</h3>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{dashboardData.stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border dark:border-zinc-800">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Courses</h3>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{dashboardData.stats.totalCourses}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-900/30">
              <h3 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Enrollments</h3>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{dashboardData.stats.totalEnrollments}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-orange-100 dark:border-orange-900/30">
              <h3 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">Instructor Req</h3>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{dashboardData.stats.pendingInstructors}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-red-100 dark:border-red-900/30">
              <h3 className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Course Req</h3>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{dashboardData.stats.pendingCourses || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h3>
              <div className="space-y-3">
                {dashboardData.recentUsers.map(user => (
                  <div key={user._id} className="flex justify-between items-center py-2">
                    <span className="font-medium dark:text-gray-300">{user.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'approved' ? 'bg-green-100 text-green-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Courses</h3>
              <div className="space-y-3">
                {dashboardData.recentCourses.map(course => (
                  <div key={course._id} className="flex justify-between items-center py-2">
                    <div>
                      <span className="font-medium block">{course.title}</span>
                      <span className="text-sm text-gray-500">by {course.instructor?.name}</span>
                    </div>
                    <span className="font-semibold text-green-600">${course.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Catalog Management</h2>
          <div className="space-y-4">
            {allCourses.map(course => (
              <div key={course._id} className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{course.title}</h4>
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${
                      course.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      course.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      course.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {course.status || 'published'}
                    </span>
                    {course.isFeatured && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-[10px] font-black uppercase rounded-lg flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-700" /> Featured
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 font-bold text-sm">Instructor: {course.instructor?.name}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="font-bold text-indigo-600">${course.price}</span>
                    <span>Enrollments: {course.enrollmentCount}</span>
                    <span>Date: {new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[120px]">
                  {course.status === 'published' && (
                    <button 
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        course.isFeatured 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => handleToggleFeatured(course._id)}
                    >
                      {course.isFeatured ? 'Featured' : 'Mark Featured'}
                    </button>
                  )}
                  <button 
                    className="text-gray-400 hover:text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-8">
          {/* Students Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Students ({students.length})</h2>
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No students registered yet</div>
            ) : (
              <div className="space-y-4">
                {students.map(student => (
                  <div key={student._id} className="border dark:border-zinc-800 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <div>
                      <h4 className="font-semibold text-lg dark:text-white">Student Name: {student.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">Student Email: {student.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {student.role}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {student.status}
                        </span>
                        <span className="text-sm text-gray-500">Joined: {new Date(student.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {student.status === 'suspended' ? (
                        <button 
                          className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors"
                          onClick={() => handleActivateUser(student._id)}
                        >
                          Activate
                        </button>
                      ) : (
                        <button 
                          className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-3 py-1 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => handleSuspendUser(student._id)}
                        >
                          Suspend
                        </button>
                      )}
                      <button 
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        onClick={() => handleGrantAdmin(student._id)}
                      >
                        Make Admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructors Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Instructors ({instructors.length})</h2>
            {instructors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No instructors registered yet</div>
            ) : (
              <div className="space-y-4">
                {instructors.map(instructor => (
                  <div key={instructor._id} className="border dark:border-zinc-800 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <div>
                      <h4 className="font-semibold text-lg dark:text-white">Instructor Name: {instructor.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">Instructor Email: {instructor.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                          {instructor.role}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          instructor.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                          instructor.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                          {instructor.status}
                        </span>
                        <span className="text-sm text-gray-500">Joined: {new Date(instructor.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {instructor.status === 'suspended' ? (
                        <button 
                          className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors"
                          onClick={() => handleActivateUser(instructor._id)}
                        >
                          Activate
                        </button>
                      ) : (
                        <button 
                          className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-3 py-1 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => handleSuspendUser(instructor._id)}
                        >
                          Suspend
                        </button>
                      )}
                      {instructor.status === 'approved' && (
                        <button 
                          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                          onClick={() => handleRevokeInstructor(instructor._id)}
                        >
                          Revoke
                        </button>
                      )}
                      <button 
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        onClick={() => handleGrantAdmin(instructor._id)}
                      >
                        Make Admin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admins Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Administrators ({admins.length})</h2>
            {admins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No other administrators found</div>
            ) : (
              <div className="space-y-4">
                {admins.map(adm => (
                  <div key={adm._id} className="border dark:border-zinc-800 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <div>
                      <h4 className="font-semibold text-lg dark:text-white">Admin Name: {adm.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">Admin Email: {adm.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 font-black uppercase">
                          {adm.role}
                        </span>
                        <span className="text-sm text-gray-500">Joined: {new Date(adm.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {user._id !== adm._id && (
                        <button 
                          className="bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 px-3 py-1 rounded text-sm font-bold hover:bg-orange-100 transition-colors"
                          onClick={() => handleRevokeAdmin(adm._id)}
                        >
                          Revoke Admin Role
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-8">
          {/* Pending Approvals */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" /> Pending Approvals
            </h2>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest border-2 border-dashed dark:border-zinc-800 rounded-[2rem]">No pending payments to verify</div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map(pay => (
                  <div key={pay._id} className="border dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col lg:flex-row justify-between lg:items-center gap-8 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="bg-indigo-600 text-white h-14 w-14 rounded-2xl flex items-center justify-center text-2xl">
                            {pay.paymentMethod === 'balance' ? '💰' : pay.paymentMethod === 'cbe' ? '🏦' : '📱'}
                         </div>
                         <div>
                            <h4 className="font-black text-2xl text-gray-900 dark:text-white">{pay.course?.title}</h4>
                            <p className="text-indigo-600 font-black tracking-widest uppercase text-xs">{pay.paymentMethod} • {formatPaymentAmount(pay)}</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student</p>
                            <p className="font-bold dark:text-white">{pay.user?.name}</p>
                            <p className="text-xs text-gray-500">{pay.user?.email}</p>
                         </div>
                         <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transaction</p>
                            <p className="font-black text-indigo-600 font-mono tracking-widest">{pay.transactionId}</p>
                            <p className="text-[10px] text-gray-400">{new Date(pay.createdAt).toLocaleString()}</p>
                         </div>
                      </div>
                    </div>
                    
                    <div className="flex lg:flex-col gap-3">
                      <button 
                        onClick={() => handleProcessPayment(pay._id, 'approved')}
                        className="flex-1 bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleProcessPayment(pay._id, 'rejected')}
                        className="flex-1 bg-red-100 text-red-600 px-10 py-4 rounded-2xl font-black hover:bg-red-200 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border dark:border-zinc-800 overflow-hidden">
            <div className="p-8 border-b dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex justify-between items-center">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <History className="h-8 w-8 text-indigo-600" /> Payment History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date / Time</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Course Purchased</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Balance Paid</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((pay) => (
                    <tr key={pay._id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-black text-gray-900 dark:text-white uppercase">{pay.user?.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold">{pay.user?.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold dark:text-gray-300">{new Date(pay.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-500">{new Date(pay.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-indigo-600 leading-tight">{pay.course?.title}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">ID: {pay.transactionId}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-emerald-600">{formatPaymentAmount(pay)}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-black">{pay.paymentMethod}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          pay.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          pay.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Refund Requests</h2>
          {refundRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest">No pending refunds to process</div>
          ) : (
            <div className="space-y-4">
              {refundRequests.map(refund => (
                <div key={refund._id} className="border dark:border-zinc-800 rounded-3xl p-8 flex flex-col lg:flex-row justify-between lg:items-center gap-8 bg-gray-50/30 dark:bg-zinc-950/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="bg-orange-600 text-white h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black">💸</div>
                       <div>
                          <h4 className="font-black text-xl text-gray-900 dark:text-white leading-tight">{refund.course?.title}</h4>
                          <p className="text-orange-600 font-bold text-sm">Refund Amount: {refund.amount} {settings?.currency || 'ETB'}</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                       <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student Details</p>
                          <p className="text-sm font-bold dark:text-white">{refund.user?.name}</p>
                          <p className="text-xs text-gray-500">{refund.user?.email}</p>
                       </div>
                       <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason for Refund</p>
                          <p className="text-sm font-medium dark:text-gray-300 italic">"{refund.reason}"</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex lg:flex-col gap-3">
                    <button 
                      onClick={() => handleProcessRefund(refund._id, 'approved')}
                      className="flex-1 bg-orange-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-orange-700 transition shadow-lg shadow-orange-500/20"
                    >
                      Approve Refund
                    </button>
                    <button 
                      onClick={() => handleProcessRefund(refund._id, 'rejected')}
                      className="flex-1 bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-2 border-gray-100 dark:border-zinc-800 px-10 py-4 rounded-2xl font-black hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Lifetime Revenue</p>
              <h3 className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{revenueData?.lifetimeTotal?.toLocaleString()} ETB</h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Enrollments</p>
              <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{dashboardData?.stats?.totalEnrollments}</h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Platform Fee (Est)</p>
              <h3 className="text-4xl font-black text-orange-600 dark:text-orange-400">{(revenueData?.lifetimeTotal * 0.1).toLocaleString()} ETB</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Month</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Count</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData?.monthlyRevenue?.map((m, index) => (
                    <tr key={index} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold dark:text-gray-300">{m._id.month}/{m._id.year}</td>
                      <td className="px-6 py-4 dark:text-gray-400">{m.count} sales</td>
                      <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400">{m.total.toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Top Selling Courses</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {revenueData?.topCourses?.map((course) => (
                <div key={course.id} className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border dark:border-zinc-800">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">{course.title}</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{course.students} students</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">Price: {course.price} ETB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b dark:border-zinc-800 bg-amber-50/50 dark:bg-amber-950/20 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Affiliate Payout Requests</h3>
                <p className="text-xs text-amber-600 font-bold uppercase">Pending withdrawals from instructors and students</p>
              </div>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">{pendingWithdrawals.filter(w => w.status === 'pending').length} PENDING</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Bank Details</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWithdrawals.map((w) => (
                    <tr key={w._id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold dark:text-gray-200">{w.user?.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono uppercase">{w.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">
                        {w.amount.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold dark:text-gray-300">{w.bankName}</div>
                        <div className="text-xs text-gray-500 font-mono uppercase tracking-tighter">{w.accountNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        {w.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleProcessWithdrawal(w._id, 'approved')}
                              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-black hover:bg-emerald-700 shadow-md"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleProcessWithdrawal(w._id, 'rejected')}
                              className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${w.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {w.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pendingWithdrawals.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium italic">No payout requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex justify-between items-center">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">System Audit Logs</h3>
            <span className="text-xs bg-gray-200 dark:bg-zinc-700 px-3 py-1 rounded-full font-bold dark:text-gray-300">Last 100 Actions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Admin</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Target</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold dark:text-gray-200">{log.admin?.name}</div>
                      <div className="text-[10px] text-gray-400">{log.admin?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.action.includes('Delete') ? 'bg-red-100 text-red-700' :
                        log.action.includes('Approve') ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-mono text-gray-500">{log.targetType.toUpperCase()}</div>
                      <div className="text-[10px]">{log.targetId}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-tighter">System Configuration</h2>
          
          <form onSubmit={handleUpdateSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Platform Name</label>
                <input 
                  type="text"
                  value={settings?.siteName || ''}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">System Currency</label>
                <select 
                  value={settings?.currency || 'ETB'}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl outline-none dark:text-white"
                >
                  <option value="ETB">Ethiopian Birr (ETB)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Contact Email</label>
                <input 
                  type="email"
                  placeholder="support@yourplatform.com"
                  value={settings?.contactEmail || ''}
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Support Phone</label>
                <input 
                  type="text"
                  placeholder="+251 ..."
                  value={settings?.supportPhone || ''}
                  onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Social Media Presence</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text"
                  placeholder="Facebook URL"
                  value={settings?.socialLinks?.facebook || ''}
                  onChange={(e) => setSettings({...settings, socialLinks: {...(settings.socialLinks || {}), facebook: e.target.value}})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl outline-none dark:text-white text-xs"
                />
                <input 
                  type="text"
                  placeholder="Twitter URL"
                  value={settings?.socialLinks?.twitter || ''}
                  onChange={(e) => setSettings({...settings, socialLinks: {...(settings.socialLinks || {}), twitter: e.target.value}})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl outline-none dark:text-white text-xs"
                />
                <input 
                  type="text"
                  placeholder="LinkedIn URL"
                  value={settings?.socialLinks?.linkedin || ''}
                  onChange={(e) => setSettings({...settings, socialLinks: {...(settings.socialLinks || {}), linkedin: e.target.value}})}
                  className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl outline-none dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
              <div>
                <h4 className="font-black text-red-900 dark:text-red-400">Maintenance Mode</h4>
                <p className="text-xs text-red-700 dark:text-red-500">Prevent users from accessing the platform during updates.</p>
              </div>
              <button 
                type="button"
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`w-14 h-8 rounded-full transition-all relative ${settings?.maintenanceMode ? 'bg-red-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.maintenanceMode ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 dark:text-white">Affiliate Revenue Logic</h4>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Global Commission Rate</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <p className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                  This percentage is paid to the affiliate (referrer) for every successful course purchase made through their link.
                </p>
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-xl border dark:border-zinc-800 shadow-sm">
                  <input 
                    type="number"
                    value={settings?.commissionRate || 10}
                    onChange={(e) => setSettings({...settings, commissionRate: e.target.value})}
                    className="w-16 bg-transparent text-center font-black text-xl text-indigo-600 outline-none"
                  />
                  <span className="font-black text-gray-400 text-xl pr-2">%</span>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={updatingSettings}
              className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {updatingSettings ? 'Saving Changes...' : 'Save System Settings'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'course_approvals' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border dark:border-zinc-800 p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-500" /> Pending Course Requests
            </h2>
            {pendingCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg font-bold uppercase tracking-widest">No pending courses</div>
                <p className="text-gray-500 mt-2">All course submissions have been reviewed.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {pendingCourses.map(course => (
                  <div key={course._id} className="bg-gray-50 dark:bg-zinc-950/50 border dark:border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center gap-6 w-full">
                       <div className="h-20 w-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center overflow-hidden">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <BookOpen className="h-8 w-8 text-indigo-600" />
                          )}
                       </div>
                       <div className="flex-1">
                          <h4 className="font-black text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                          <div className="flex flex-wrap gap-4 mt-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border dark:border-zinc-800">
                                Instructor: <span className="text-indigo-600">{course.instructor?.name}</span>
                             </p>
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border dark:border-zinc-800">
                                Price: <span className="text-emerald-600">{course.price} {course.currency}</span>
                             </p>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        className="flex-1 md:flex-none h-12 px-6 bg-indigo-600 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-indigo-600/20"
                        onClick={() => handleApproveCourse(course._id)}
                      >
                        Approve & Publish
                      </button>
                      <button 
                        className="flex-1 md:flex-none h-12 px-6 bg-white dark:bg-zinc-900 text-red-600 border border-red-100 dark:border-red-900/30 rounded-xl font-black text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                        onClick={() => handleRejectCourse(course._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border dark:border-zinc-800 p-8">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" /> Course Decision History
            </h2>
            {courseHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400 font-bold uppercase tracking-widest text-xs">No historical records</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b dark:border-zinc-800 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      <th className="py-4 pr-4 text-center w-16">#</th>
                      <th className="py-4 pr-4">Course Title</th>
                      <th className="py-4 pr-4 text-center">Status</th>
                      <th className="py-4 pr-4">Instructor</th>
                      <th className="py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-800">
                    {courseHistory.map((hist, idx) => (
                      <tr key={hist._id} className="text-sm group">
                        <td className="py-4 text-center font-black text-gray-400">{idx + 1}</td>
                        <td className="py-4">
                           <div className="font-black text-gray-900 dark:text-white">{hist.title}</div>
                        </td>
                        <td className="py-4 text-center">
                           <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                             hist.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {hist.status === 'published' ? 'Approved' : 'Rejected'}
                           </span>
                        </td>
                        <td className="py-4 font-bold text-gray-600 dark:text-gray-400">{hist.instructor?.name}</td>
                        <td className="py-4 text-right text-xs font-black text-gray-400">{new Date(hist.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bundle_approvals' && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex bg-gray-200 dark:bg-zinc-800 p-1 rounded-2xl w-max">
            <button
              onClick={() => setBundleSubTab('pending')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                bundleSubTab === 'pending'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Pending ({pendingBundles.length})
            </button>
            <button
              onClick={() => setBundleSubTab('history')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                bundleSubTab === 'history'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              History
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border dark:border-zinc-800 p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-violet-500" /> 
              {bundleSubTab === 'pending' ? 'Pending Bundle Requests' : 'Bundle History'}
            </h2>
            
            {bundleSubTab === 'pending' && (
              pendingBundles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-violet-50 dark:bg-violet-900/20 rounded-[32px] flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-violet-300" />
                  </div>
                  <div className="text-gray-400 text-lg font-bold uppercase tracking-widest">No pending bundle requests</div>
                  <p className="text-gray-500 mt-2">All bundle submissions have been reviewed.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {pendingBundles.map(bundle => (
                    <div key={bundle._id} className="bg-gray-50 dark:bg-zinc-950/50 border dark:border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start gap-6 group hover:border-violet-500/50 transition-all">
                      <div className="flex items-start gap-6 w-full">
                        <div className="h-20 w-20 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {bundle.image ? (
                            <img src={bundle.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <BookOpen className="h-8 w-8 text-violet-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-xl text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors">{bundle.title}</h4>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{bundle.description}</p>
                          <div className="flex flex-wrap gap-3 mt-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border dark:border-zinc-800">
                              Instructor: <span className="text-violet-600">{bundle.instructor?.name}</span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border dark:border-zinc-800">
                              Price: <span className="text-emerald-600">{bundle.price} ETB</span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border dark:border-zinc-800">
                              Courses: <span className="text-indigo-600">{bundle.courses?.length || 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
                        <button
                          className="flex-1 md:flex-none h-12 px-6 bg-violet-600 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-violet-600/20"
                          onClick={() => handleBundleStatus(bundle._id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="flex-1 md:flex-none h-12 px-6 bg-white dark:bg-zinc-900 text-red-600 border border-red-100 dark:border-red-900/30 rounded-xl font-black text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                          onClick={() => handleBundleStatus(bundle._id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {bundleSubTab === 'history' && (
              bundleHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg font-bold uppercase tracking-widest">No bundle history</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800">
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Bundle Info</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Price</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Instructor</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundleHistory.map(bundle => (
                        <tr key={bundle._id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold dark:text-gray-200">{bundle.title}</div>
                            <div className="text-xs text-gray-500">{bundle.courses?.length || 0} courses</div>
                          </td>
                          <td className="px-6 py-4 font-bold dark:text-gray-300">{bundle.price} ETB</td>
                          <td className="px-6 py-4 dark:text-gray-300">{bundle.instructor?.name || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                              bundle.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {bundle.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;