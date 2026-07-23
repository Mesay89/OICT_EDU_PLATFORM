import React, { useState, useEffect } from 'react';
import { 
  Star, Users, LayoutDashboard, BookOpen, UserCheck, 
  RefreshCw, CreditCard, BarChart3, History, Settings, 
  ClipboardCheck, AlertCircle, Clock, ArrowLeft, ChevronLeft,
  PlayCircle, CheckCircle, X, Mail, Tag, MessageSquare,
  Award, Bell, FileText, Shield, UserPlus, TrendingUp
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BASE_URL from '../api/config';

// ─── Video URL Helpers ────────────────────────────────────────────────────────
const getYouTubeId = (url) => {
  if (!url) return null;
  try {
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || null;
    if (url.includes('youtube.com/shorts/')) return url.split('shorts/')[1]?.split('?')[0] || null;
    if (url.includes('youtube.com/embed/')) return url.split('embed/')[1]?.split('?')[0] || null;
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  } catch { return null; }
};

const getGDrivePreviewUrl = (url) => {
  if (!url) return null;
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return `https://drive.google.com/file/d/${m1[1]}/preview`;
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.google.com/file/d/${m2[1]}/preview`;
  // Already a preview url
  if (url.includes('/preview')) return url;
  return url.replace('/view', '/preview');
};

const isYouTubeUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
const isGDriveUrl  = (url) => url && (url.includes('drive.google.com') || url.includes('docs.google.com'));

// VideoPreview: renders the right player for any video source
const VideoPreview = ({ videoUrl, videoSource, title = 'Preview' }) => {
  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <PlayCircle className="h-16 w-16 text-gray-600" />
      </div>
    );
  }
  const isYT = videoSource === 'youtube' || isYouTubeUrl(videoUrl);
  const isGD = videoSource === 'googledrive' || isGDriveUrl(videoUrl);
  if (isYT) {
    const ytId = getYouTubeId(videoUrl);
    if (ytId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      );
    }
  }
  if (isGD) {
    return (
      <iframe
        src={getGDrivePreviewUrl(videoUrl)}
        className="w-full h-full"
        allow="autoplay"
        allowFullScreen
        title={title}
      />
    );
  }
  // Local / direct URL
  return <video src={videoUrl} controls className="w-full h-full" title={title} />;
};
// ─────────────────────────────────────────────────────────────────────────────

const PendingBundleCard = ({ bundle, onApprove, onReject }) => {
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const courses = bundle.courses || [];
  const previewCourse = courses[selectedPreviewIdx];

  return (
    <div className="bg-gray-50 dark:bg-zinc-950/50 border dark:border-zinc-800 rounded-3xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Bundle Video Preview */}
        <div className="lg:w-2/5 bg-black relative flex flex-col">
          <div className="aspect-video w-full">
            {previewCourse?.introVideoUrl ? (
              <VideoPreview
                videoUrl={previewCourse.introVideoUrl}
                videoSource={previewCourse.videoSource}
                title={`${bundle.title} — Preview ${selectedPreviewIdx + 1}`}
              />
            ) : bundle.image ? (
              <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <BookOpen className="h-16 w-16 text-gray-600" />
              </div>
            )}
          </div>
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 pointer-events-none">
            <span className="text-white font-black text-sm">Bundle Preview</span>
          </div>

          {/* Video Selector below player */}
          {courses.length > 1 && (
            <div className="bg-zinc-900 p-4 border-t border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Select Course to Preview</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {courses.map((course, idx) => (
                  <button
                    key={course._id || idx}
                    onClick={() => setSelectedPreviewIdx(idx)}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                      selectedPreviewIdx === idx
                        ? 'bg-violet-600 text-white'
                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {course.title || `Course ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bundle Details */}
        <div className="lg:w-3/5 p-8 flex flex-col">
          <div className="flex-1">
            <h4 className="font-black text-2xl text-gray-900 dark:text-white mb-3">{bundle.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{bundle.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border dark:border-zinc-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Instructor</p>
                <p className="text-sm font-bold text-violet-600">{bundle.instructor?.name}</p>
                <p className="text-xs text-gray-500">{bundle.instructor?.email}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border dark:border-zinc-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Price</p>
                <p className="text-sm font-bold text-emerald-600">{bundle.price} ETB</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800 mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Included Courses ({bundle.courses?.length || 0})</p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {(bundle.courses || []).map((course, idx) => (
                  <div key={course._id || idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0"></span>
                    <span className="font-medium">{course.title || `Course ${idx + 1}`}</span>
                    {course.price !== undefined && (
                      <span className="ml-auto text-gray-400">{course.price} ETB</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-zinc-800">
            <button
              className="flex-1 h-12 px-6 bg-violet-600 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
              onClick={onApprove}
            >
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
            <button
              className="flex-1 h-12 px-6 bg-white dark:bg-zinc-900 text-red-600 border border-red-100 dark:border-red-900/30 rounded-xl font-black text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2"
              onClick={onReject}
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


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
  const [cashManagers, setCashManagers] = useState([]);
  const [instructorHistory, setInstructorHistory] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [courseHistory, setCourseHistory] = useState([]);
  const [pendingBundles, setPendingBundles] = useState([]);
  const [bundleHistory, setBundleHistory] = useState([]);
  const [bundleSubTab, setBundleSubTab] = useState('pending');
  const [settingsSubTab, setSettingsSubTab] = useState('general');
  const [contentApprovalsSubTab, setContentApprovalsSubTab] = useState('assignments');
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [pendingCourseModules, setPendingCourseModules] = useState([]);
  const [pendingBundleModules, setPendingBundleModules] = useState([]);

  // New management states
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', targetType: 'all', targetId: null });
  const [editingNotification, setEditingNotification] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', scheduledFor: null });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [moderationContent, setModerationContent] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${BASE_URL}/reviews/admin/all`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const response = await fetch(`${BASE_URL}/reviews/admin/${reviewId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        if (response.ok) {
          alert('Review deleted successfully');
          fetchReviews();
        }
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const fetchCertificates = async () => {
    try {
      const [courseCerts, bundleCerts] = await Promise.all([
        fetch(`${BASE_URL}/certificates/admin/all`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        }).then(res => res.json()),
        fetch(`${BASE_URL}/quiz/admin/bundle-certificates`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        }).then(res => res.json())
      ]);
      
      // Mark course certificates with type
      const courseWithType = Array.isArray(courseCerts) ? courseCerts.map(cert => ({ ...cert, type: 'course' })) : [];
      const bundleWithType = Array.isArray(bundleCerts) ? bundleCerts : [];
      
      // Combine both types
      const allCertificates = [...courseWithType, ...bundleWithType];
      setCertificates(allCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    }
  };

  const handleRevokeCertificate = async (certificateId, certType) => {
    const reason = prompt('Enter revocation reason (e.g., "Student violated platform policies", "Cheating detected"):');
    if (!reason) return; // User cancelled
    
    try {
      const endpoint = certType === 'bundle' 
        ? `${BASE_URL}/quiz/admin/bundle-certificate/${certificateId}/revoke`
        : `${BASE_URL}/certificates/admin/${certificateId}/revoke`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        alert('✅ Certificate revoked successfully! Download & screenshot protections are now active.');
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error revoking certificate:', error);
      alert('Failed to revoke certificate');
    }
  };

  const handleActivateCertificate = async (certificateId, certType) => {
    if (!window.confirm('Are you sure you want to reactivate this certificate? This will remove all restrictions.')) return;
    
    try {
      const endpoint = certType === 'bundle'
        ? `${BASE_URL}/quiz/admin/bundle-certificate/${certificateId}/activate`
        : `${BASE_URL}/certificates/admin/${certificateId}/activate`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      if (response.ok) {
        alert('✅ Certificate activated successfully! All restrictions have been removed.');
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error activating certificate:', error);
      alert('Failed to activate certificate');
    }
  };

  const handleDeleteCertificate = async (certificateId, certType) => {
    if (window.confirm('⚠️ Are you sure you want to PERMANENTLY delete this certificate? This action cannot be undone.')) {
      try {
        const endpoint = certType === 'bundle'
          ? `${BASE_URL}/quiz/admin/bundle-certificate/${certificateId}`
          : `${BASE_URL}/certificates/admin/${certificateId}`;
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        if (response.ok) {
          alert('✅ Certificate deleted permanently.');
          fetchCertificates();
        }
      } catch (error) {
        console.error('Error deleting certificate:', error);
      }
    }
  };

  const fetchModerationContent = async () => {
    try {
      const response = await fetch(`${BASE_URL}/moderation/admin/all`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setModerationContent(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching moderation content:', error);
      setModerationContent([]);
    }
  };

  const handleUpdateModeration = async (reportId, status, actionTaken, notes) => {
    try {
      const response = await fetch(`${BASE_URL}/moderation/admin/${reportId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, actionTaken, notes }),
      });
      if (response.ok) {
        alert('Moderation report updated successfully');
        fetchModerationContent();
      }
    } catch (error) {
      console.error('Error updating moderation report:', error);
    }
  };

  const handleDeleteModerationReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const response = await fetch(`${BASE_URL}/moderation/admin/${reportId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        if (response.ok) {
          alert('Report deleted successfully');
          fetchModerationContent();
        }
      } catch (error) {
        console.error('Error deleting moderation report:', error);
      }
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/enrollments/admin/all`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        const response = await fetch(`${BASE_URL}/enrollments/admin/${enrollmentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        if (response.ok) {
          alert('Enrollment deleted successfully');
          fetchEnrollments();
        }
      } catch (error) {
        console.error('Error deleting enrollment:', error);
      }
    }
  };

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

  const fetchPendingQuizzes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/quiz/admin/pending`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingQuizzes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending quizzes:', error);
    }
  };

  const fetchPendingCourseModules = async () => {
    try {
      const response = await fetch(`${BASE_URL}/courses/admin/pending-modules`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingCourseModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending course modules:', error);
    }
  };

  const fetchPendingBundleModules = async () => {
    try {
      const response = await fetch(`${BASE_URL}/bundles/admin/pending-modules`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setPendingBundleModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending bundle modules:', error);
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
      let reason = null;
      
      // ✅ If rejecting, prompt for rejection reason
      if (status === 'rejected') {
        reason = prompt('Please enter the reason for rejecting this bundle:\n\n(This will be sent to the instructor as a notification)');
        
        // If user cancels or provides empty reason, abort
        if (!reason || reason.trim().length === 0) {
          return; // User cancelled or entered empty reason
        }
      }

      const response = await fetch(`${BASE_URL}/bundles/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason: reason ? reason.trim() : null }),
      });
      
      if (response.ok) {
        if (status === 'rejected') {
          alert('✅ Bundle rejected and instructor notified!');
        } else {
          alert(`✅ Bundle ${status} successfully!`);
        }
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
    if (user?.role === 'admin' || user?.role === 'superAdmin') {
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
      fetchPendingQuizzes();
      fetchPendingCourseModules();
      fetchPendingBundleModules();
      fetchWithdrawals();
      fetchAllPayments();
      fetchInstructorHistory();
      fetchAssignmentHistory();
      fetchPendingCourses();
      fetchCourseHistory();
      fetchPendingBundles();
      fetchBundleHistory();
      fetchAnnouncements();
      fetchNotifications();
      fetchReviews();
      fetchCertificates();
      fetchModerationContent();
      fetchEnrollments();
      
      // Set loading to false after a timeout to prevent infinite loading
      setTimeout(() => setLoading(false), 3000);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

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

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/announcements`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${BASE_URL}/notifications/all`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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

  const [rejectPaymentId, setRejectPaymentId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleProcessPayment = async (id, status, reason = '') => {
    try {
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      const body = status === 'rejected' ? JSON.stringify({ reason }) : '{}';
      // Optimistically remove from pending
      setPendingPayments(prev => prev.filter(p => p._id !== id));
      const response = await fetch(`${BASE_URL}/admin/payments/${id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      if (!response.ok) {
        // Rollback on failure
        fetchPendingPayments();
        const err = await response.json();
        alert(`Failed: ${err.message}`);
      } else {
        alert(`Payment ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      fetchPendingPayments();
      alert(`Error: ${error.message}`);
    }
  };

  const handleRejectClick = (id) => {
    setRejectPaymentId(id);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    await handleProcessPayment(rejectPaymentId, 'rejected', rejectReason);
    setRejectPaymentId(null);
    setRejectReason('');
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
      let rejectionReason = '';
      if (status === 'rejected') {
        rejectionReason = window.prompt('Enter reason for rejection:');
        if (rejectionReason === null) return;
      }
      const response = await fetch(`${BASE_URL}/lms/assignments/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (response.ok) {
        alert(`Assignment ${status}`);
        fetchPendingAssignments();
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleUpdateQuizStatus = async (id, status) => {
    try {
      let rejectionReason = '';
      if (status === 'rejected') {
        rejectionReason = window.prompt('Enter reason for rejection:');
        if (rejectionReason === null) return;
      }
      const response = await fetch(`${BASE_URL}/quiz/${id}/admin-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (response.ok) {
        alert(`Quiz ${status}`);
        fetchPendingQuizzes();
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
    }
  };

  const handleUpdateCourseModuleStatus = async (courseId, moduleId, status) => {
    try {
      let rejectionReason = '';
      if (status === 'rejected') {
        rejectionReason = window.prompt('Enter reason for rejection:');
        if (rejectionReason === null) return;
      }
      const response = await fetch(`${BASE_URL}/courses/admin/modules/${courseId}/${moduleId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (response.ok) {
        alert(`Course module ${status}`);
        fetchPendingCourseModules();
      }
    } catch (error) {
      console.error('Error updating course module:', error);
    }
  };

  const handleUpdateBundleModuleStatus = async (bundleId, moduleId, status) => {
    try {
      let rejectionReason = '';
      if (status === 'rejected') {
        rejectionReason = window.prompt('Enter reason for rejection:');
        if (rejectionReason === null) return;
      }
      const response = await fetch(`${BASE_URL}/bundles/${bundleId}/modules/${moduleId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (response.ok) {
        alert(`Bundle module ${status}`);
        fetchPendingBundleModules();
      }
    } catch (error) {
      console.error('Error updating bundle module:', error);
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
      const adminUsers = data.filter(user => user.role === 'admin' || user.role === 'superAdmin');
      const cashManagerUsers = data.filter(user => user.role === 'cashManager');
      
      setStudents(studentUsers);
      setInstructors(instructorUsers);
      setAdmins(adminUsers);
      setCashManagers(cashManagerUsers);
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
    // ✅ Prompt admin for rejection reason
    const reason = prompt('Please enter the reason for rejecting this instructor application:\n\n(This will be sent to the instructor via email)');
    
    // If user cancels or provides empty reason, abort
    if (!reason || reason.trim().length === 0) {
      return; // User cancelled or entered empty reason
    }

    try {
      const response = await fetch(`${BASE_URL}/admin/reject-instructor/${instructorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('✅ Instructor rejected and notified via email');
        fetchPendingInstructors();
        fetchInstructorHistory();
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

  const handleGrantCashManager = async (userId) => {
    if (window.confirm('Are you sure you want to grant cash manager role to this user?')) {
      try {
        const response = await fetch(`${BASE_URL}/admin/grant-cash-manager/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          alert('Cash manager role granted successfully!');
          fetchAllUsers();
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error granting cash manager role:', error);
        alert('Failed to grant cash manager role');
      }
    }
  };

  const handleRevokeCashManager = async (userId) => {
    if (window.confirm('Are you sure you want to revoke cash manager role from this user?')) {
      try {
        const response = await fetch(`${BASE_URL}/admin/revoke-cash-manager/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          alert('Cash manager role revoked successfully!');
          fetchAllUsers();
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error revoking cash manager role:', error);
        alert('Failed to revoke cash manager role');
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

  if (user?.role !== 'admin' && user?.role !== 'superAdmin') {
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
            <h1 className="text-[32px] font-bold tracking-tight leading-[1.5] text-[#F9FAFB]">
              {user.role === 'superAdmin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
            </h1>
            <p className="mt-2 text-[16px] font-medium leading-[1.5] text-[#F9FAFB]/90">Control center for system management & analytics</p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[16px] font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-md leading-[1.5] text-[#F9FAFB]">Welcome, {user.name}</span>
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
            { id: 'content_approvals', label: 'Content Approvals', icon: ClipboardCheck, color: 'blue', count: pendingAssignments.length + pendingQuizzes.length + pendingCourseModules.length + pendingBundleModules.length, border: 'border-blue-500/30' },
            { id: 'course_approvals', label: 'Course Approval', icon: Star, color: 'yellow', count: pendingCourses.length, border: 'border-yellow-500/30' },
            { id: 'bundle_approvals', label: 'Bundle Approval', icon: BookOpen, color: 'violet', count: pendingBundles.length, border: 'border-violet-500/30' },
            { id: 'revenue', label: 'Revenue', icon: BarChart3, color: 'cyan', border: 'border-cyan-500/30' },
            { id: 'audit', label: 'Audit Logs', icon: History, color: 'zinc', border: 'border-zinc-500/30' },
            { id: 'settings', label: 'Settings', icon: Settings, color: 'slate', border: 'border-slate-500/30' },
            { id: 'categories', label: 'Categories', icon: Tag, color: 'pink', border: 'border-pink-500/30' },
            { id: 'reviews', label: 'Reviews', icon: MessageSquare, color: 'rose', border: 'border-rose-500/30' },
            { id: 'notifications', label: 'Notifications', icon: Bell, color: 'orange', border: 'border-orange-500/30' },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'teal', border: 'border-teal-500/30' },
            { id: 'certificates', label: 'Certificates', icon: Award, color: 'amber', border: 'border-amber-500/30' },
            { id: 'announcements', label: 'Announcements', icon: Mail, color: 'indigo', border: 'border-indigo-500/30' },
            { id: 'moderation', label: 'Moderation', icon: Shield, color: 'red', border: 'border-red-500/30' },
            { id: 'enrollments', label: 'Enrollments', icon: UserPlus, color: 'green', border: 'border-green-500/30' },
          ].filter(tab => {
            // Super Admin can access everything
            if (user?.role === 'superAdmin') return true;
            // Regular Admin restrictions
            const restrictedTabs = ['refunds', 'payments', 'revenue', 'audit', 'settings', 'announcements'];
            return !restrictedTabs.includes(tab.id);
          }).map((tab) => {
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
                <span className="text-[16px] font-bold leading-[1.5] text-center text-[#111827] dark:text-[#F9FAFB] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {tab.label}
                </span>
                {tab.count > 0 && (
                  <span className="absolute top-4 right-4 bg-red-600 text-white text-[12px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-900 leading-[1.5]">
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
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl font-bold text-[16px] leading-[1.5] text-[#111827] dark:text-[#F9FAFB] hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 transition-all shadow-sm group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Back to Navigation
          </button>
          <div className="text-right">
             <h2 className="text-[24px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">
               {activeTab === 'instructors' && 'Instructor Management'}
               {activeTab === 'assignments' && 'Assignments Review'}
               {activeTab === 'content_approvals' && 'Content Approvals'}
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
               {activeTab === 'categories' && 'Categories Management'}
               {activeTab === 'reviews' && 'Reviews & Ratings'}
               {activeTab === 'notifications' && 'Notification Management'}
               {activeTab === 'analytics' && 'Reports & Analytics'}
               {activeTab === 'certificates' && 'Certificate Management'}
               {activeTab === 'announcements' && 'Announcement Management'}
               {activeTab === 'quiz_management' && 'Quiz & Assignment Management'}
               {activeTab === 'moderation' && 'Content Moderation'}
               {activeTab === 'enrollments' && 'Enrollment Management'}
             </h2>
             <p className="text-[16px] leading-[1.5] text-gray-500 dark:text-gray-400 font-medium">Admin Control Panel</p>
          </div>
        </div>
      )}

      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-[24px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-6">Instructor Approval Requests</h2>
            {pendingInstructors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[20px] font-medium leading-[1.5] text-gray-500 dark:text-gray-400">No pending instructor requests</div>
                <p className="text-[16px] leading-[1.5] text-gray-500 dark:text-gray-400 mt-2">All instructor applications have been processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInstructors.map(instructor => (
                  <div key={instructor._id} className="border dark:border-zinc-700 rounded-xl p-5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      {/* Instructor Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[20px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">{instructor.name}</h4>
                        <p className="text-[16px] leading-[1.5] text-gray-600 dark:text-gray-400">{instructor.email}</p>
                        <p className="text-[14px] leading-[1.5] text-gray-500 dark:text-gray-400 mt-0.5">Registered: {new Date(instructor.createdAt).toLocaleDateString()}</p>

                        {/* Documents */}
                        <div className="mt-3 space-y-2">
                          {/* CV */}
                          {instructor.cv ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide">CV</span>
                              <a
                                href={instructor.cv}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline underline-offset-2 transition-colors truncate max-w-xs"
                                title="Open CV"
                              >
                                View CV / Resume
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wide">CV</span>
                              <span className="text-sm text-gray-400 italic">No CV uploaded</span>
                            </div>
                          )}

                          {/* Certificates */}
                          {instructor.certificates && instructor.certificates.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wide flex-shrink-0">Certs</span>
                              <div className="flex flex-wrap gap-2">
                                {instructor.certificates.map((certUrl, idx) => (
                                  <a
                                    key={idx}
                                    href={certUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 underline underline-offset-2 transition-colors"
                                    title={`Open Certificate ${idx + 1}`}
                                  >
                                    Certificate {idx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wide">Certs</span>
                              <span className="text-sm text-gray-400 italic">No certificates uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-row sm:flex-col gap-3 flex-shrink-0">
                        <button 
                          className="bg-green-600 text-[#F9FAFB] text-[15px] font-bold leading-[1.5] px-5 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          onClick={() => handleApproveInstructor(instructor._id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="bg-red-600 text-[#F9FAFB] text-[15px] font-bold leading-[1.5] px-5 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          onClick={() => handleRejectInstructor(instructor._id)}
                        >
                          Reject
                        </button>
                      </div>
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

      {activeTab === 'content_approvals' && (
        <div className="space-y-6">
          {/* Sub-navigation */}
          <div className="flex space-x-2 border-b dark:border-zinc-800 pb-2 mb-6 overflow-x-auto no-scrollbar">
            {['assignments', 'quizzes', 'course_modules', 'bundle_modules'].map(tab => (
              <button
                key={tab}
                onClick={() => setContentApprovalsSubTab(tab)}
                className={`px-4 py-2 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${
                  contentApprovalsSubTab === tab
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {contentApprovalsSubTab === 'assignments' && (
            <>
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
          {/* End of Assignments History */}
          </>
          )}

          {contentApprovalsSubTab === 'quizzes' && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quiz Approval Requests</h2>
              {pendingQuizzes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">No pending quiz requests</div>
                  <p className="text-gray-500 mt-2">All quizzes have been processed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingQuizzes.map(quiz => (
                    <div key={quiz._id} className="border dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{quiz.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Instructor</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{quiz.instructor?.name}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Time Limit</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{quiz.timeLimitMinutes || 'No'} mins</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Passing Score</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{quiz.passingScore}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-emerald-700 shadow-md transition"
                            onClick={() => handleUpdateQuizStatus(quiz._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button 
                            className="bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-black hover:bg-red-50 transition"
                            onClick={() => handleUpdateQuizStatus(quiz._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      
                      {/* View Quiz Content */}
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
                        <h5 className="font-bold text-sm mb-3">Questions Preview ({quiz.questions?.length || 0})</h5>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {quiz.questions?.map((q, idx) => (
                            <div key={idx} className="bg-white dark:bg-zinc-800 p-3 rounded shadow-sm border border-gray-100 dark:border-zinc-700">
                              <p className="font-medium text-sm mb-2">{idx + 1}. {q.text || q.questionText}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {q.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className={`text-xs p-2 rounded border ${(q.correct ?? q.correctAnswer) === oIdx ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'bg-gray-50 border-gray-200 dark:bg-zinc-700/50 dark:border-zinc-600 text-gray-600 dark:text-gray-300'}`}>
                                    {opt}
                                    {(q.correct ?? q.correctAnswer) === oIdx && <CheckCircle className="inline h-3 w-3 ml-1" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {contentApprovalsSubTab === 'course_modules' && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Module Approval Requests</h2>
              {pendingCourseModules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">No pending course module requests</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCourseModules.map(mod => (
                    <div key={mod._id} className="border dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{mod.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Course</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{mod.courseTitle}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Instructor</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{mod.instructor}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Type</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{mod.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-emerald-700 shadow-md transition"
                            onClick={() => handleUpdateCourseModuleStatus(mod.courseId, mod._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button 
                            className="bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-black hover:bg-red-50 transition"
                            onClick={() => handleUpdateCourseModuleStatus(mod.courseId, mod._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
                         {mod.videoUrl ? (
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Module Video Preview</p>
                              <div className="aspect-video w-full max-w-3xl rounded-xl overflow-hidden shadow-lg bg-black">
                                <VideoPreview videoUrl={mod.videoUrl} title={mod.title} />
                              </div>
                            </div>
                         ) : null}
                         {mod.content ? (
                            <div className={mod.videoUrl ? "mt-4" : ""}>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Reading Material / Document</p>
                              {(mod.content.toLowerCase().endsWith('.pdf') || mod.content.includes('/uploads/') && mod.content.match(/\.pdf$/i)) && !mod.content.includes('localhost') ? (
                                <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border dark:border-zinc-700 bg-gray-100">
                                  <iframe 
                                    src={`${mod.content}#toolbar=1`}
                                    className="w-full h-full"
                                    title={`${mod.title} - Document`}
                                    type="application/pdf"
                                  />
                                </div>
                              ) : mod.content.includes('drive.google.com') ? (
                                <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border dark:border-zinc-700">
                                  <iframe 
                                    src={mod.content.replace('/view', '/preview')}
                                    className="w-full h-full"
                                    title={`${mod.title} - Document`}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Document URL:</p>
                                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all bg-gray-50 dark:bg-zinc-900 p-2 rounded">{mod.content}</p>
                                  </div>
                                  <a 
                                    href={mod.content} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Open in New Tab
                                  </a>
                                </div>
                              )}
                            </div>
                         ) : null}
                         {!mod.videoUrl && !mod.content && (
                            <div className="text-center py-8 text-gray-400">
                              No video or document content available for preview.
                            </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {contentApprovalsSubTab === 'bundle_modules' && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bundle Module Approval Requests</h2>
              {pendingBundleModules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">No pending bundle module requests</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBundleModules.map(mod => (
                    <div key={mod._id} className="border dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{mod.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Bundle</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{mod.bundleTitle}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Instructor</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{mod.instructor}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400 uppercase font-bold tracking-tighter">Type</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{mod.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-emerald-700 shadow-md transition"
                            onClick={() => handleUpdateBundleModuleStatus(mod.bundleId, mod._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button 
                            className="bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl text-sm font-black hover:bg-red-50 transition"
                            onClick={() => handleUpdateBundleModuleStatus(mod.bundleId, mod._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
                         {mod.videoUrl ? (
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Module Video Preview</p>
                              <div className="aspect-video w-full max-w-3xl rounded-xl overflow-hidden shadow-lg bg-black">
                                <VideoPreview videoUrl={mod.videoUrl} title={mod.title} />
                              </div>
                            </div>
                         ) : null}
                         {mod.content ? (
                            <div className={mod.videoUrl ? "mt-4" : ""}>
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Reading Material / Document</p>
                              {(mod.content.toLowerCase().endsWith('.pdf') || mod.content.includes('/uploads/') && mod.content.match(/\.pdf$/i)) && !mod.content.includes('localhost') ? (
                                <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border dark:border-zinc-700 bg-gray-100">
                                  <iframe 
                                    src={`${mod.content}#toolbar=1`}
                                    className="w-full h-full"
                                    title={`${mod.title} - Document`}
                                    type="application/pdf"
                                  />
                                </div>
                              ) : mod.content.includes('drive.google.com') ? (
                                <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg border dark:border-zinc-700">
                                  <iframe 
                                    src={mod.content.replace('/view', '/preview')}
                                    className="w-full h-full"
                                    title={`${mod.title} - Document`}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Document URL:</p>
                                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all bg-gray-50 dark:bg-zinc-900 p-2 rounded">{mod.content}</p>
                                  </div>
                                  <a 
                                    href={mod.content} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Open in New Tab
                                  </a>
                                </div>
                              )}
                            </div>
                         ) : null}
                         {!mod.videoUrl && !mod.content && (
                            <div className="text-center py-8 text-gray-400">
                              No video or document content available for preview.
                            </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Top stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Users', value: dashboardData.stats.totalUsers, color: 'violet', textColor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-900/30' },
              { label: 'Total Courses', value: dashboardData.stats.totalCourses, color: 'indigo', textColor: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-900/30' },
              { label: 'Enrollments', value: dashboardData.stats.totalEnrollments, color: 'emerald', textColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
              { label: 'Instructor Requests', value: dashboardData.stats.pendingInstructors, color: 'amber', textColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-900/30' },
              { label: 'Course Requests', value: dashboardData.stats.pendingCourses || 0, color: 'red', textColor: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/30' },
            ].map(card => (
              <div key={card.label} className={`bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border ${card.border} flex flex-col gap-2`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{card.label}</p>
                <p className={`text-3xl font-black ${card.textColor}`}>{card.value?.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* SuperAdmin-only: Financial Overview */}
          {user?.role === 'superAdmin' && dashboardData.stats.totalRevenue !== undefined && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lifetime Revenue */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-200 mb-2">💰 Lifetime Revenue</p>
                <p className="text-3xl font-black">{(dashboardData.stats.totalRevenue || 0).toLocaleString()} <span className="text-lg font-bold text-violet-200">{dashboardData.currency || settings?.currency || 'ETB'}</span></p>
                <p className="text-violet-300 text-xs mt-2">Total gross from all completed payments</p>
              </div>
              {/* Platform Fee */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-2">🏦 Platform Fee ({dashboardData.stats.platformCommissionPct}%)</p>
                <p className="text-3xl font-black">{(dashboardData.stats.platformFee || 0).toLocaleString()} <span className="text-lg font-bold text-emerald-200">{dashboardData.currency || settings?.currency || 'ETB'}</span></p>
                <p className="text-emerald-100 text-xs mt-2">Platform's share at {dashboardData.stats.platformCommissionPct}% commission</p>
              </div>
              {/* Instructor Fee */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-100 mb-2">👨‍🏫 Instructor Payout ({dashboardData.stats.instructorCommissionPct}%)</p>
                <p className="text-3xl font-black">{(dashboardData.stats.instructorFee || 0).toLocaleString()} <span className="text-lg font-bold text-amber-200">{dashboardData.currency || settings?.currency || 'ETB'}</span></p>
                <p className="text-amber-100 text-xs mt-2">Instructors' share at {dashboardData.stats.instructorCommissionPct}% commission</p>
              </div>
            </div>
          )}

          {/* Recent Users & Recent Courses — redesigned */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Students</h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">Latest 5</span>
              </div>
              <div className="divide-y dark:divide-zinc-800">
                {dashboardData.recentUsers.map(u => {
                  const initials = (u.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const roleColor = u.role === 'admin' || u.role === 'superAdmin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    u.role === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                  const statusColor = u.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    u.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                  return (
                    <div key={u._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${roleColor}`}>{u.role}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${statusColor}`}>{u.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Courses */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Courses</h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">Latest 5</span>
              </div>
              <div className="divide-y dark:divide-zinc-800">
                {dashboardData.recentCourses.map(course => {
                  const statusColor = course.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    course.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                  const currency = dashboardData.currency || settings?.currency || 'ETB';
                  return (
                    <div key={course._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-sm">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{course.title}</p>
                        <p className="text-xs text-gray-400">by {course.instructor?.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{course.price} {currency}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${statusColor}`}>{course.status || 'published'}</span>
                      </div>
                    </div>
                  );
                })}
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
                      {user?.role === 'superAdmin' && (
                        <>
                          <button 
                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                            onClick={() => handleGrantAdmin(student._id)}
                          >
                            Make Admin
                          </button>
                          <button 
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                            onClick={() => handleGrantCashManager(student._id)}
                          >
                            Make Cash Mgr
                          </button>
                        </>
                      )}
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
                      {user?.role === 'superAdmin' && instructor.status === 'approved' && (
                        <button 
                          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                          onClick={() => handleRevokeInstructor(instructor._id)}
                        >
                          Revoke
                        </button>
                      )}
                      {user?.role === 'superAdmin' && (
                        <>
                          <button 
                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                            onClick={() => handleGrantAdmin(instructor._id)}
                          >
                            Make Admin
                          </button>
                          <button 
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                            onClick={() => handleGrantCashManager(instructor._id)}
                          >
                            Make Cash Mgr
                          </button>
                        </>
                      )}
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
                      {user._id !== adm._id && user?.role === 'superAdmin' && (
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

          {/* Cash Managers Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cash Managers ({cashManagers.length})</h2>
            {cashManagers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No cash managers found</div>
            ) : (
              <div className="space-y-4">
                {cashManagers.map(cm => (
                  <div key={cm._id} className="border dark:border-zinc-800 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <div>
                      <h4 className="font-semibold text-lg dark:text-white">Name: {cm.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">Email: {cm.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-black uppercase">
                          {cm.role}
                        </span>
                        <span className="text-sm text-gray-500">Joined: {new Date(cm.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {user?.role === 'superAdmin' && (
                        <button 
                          className="bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 px-3 py-1 rounded text-sm font-bold hover:bg-orange-100 transition-colors"
                          onClick={() => handleRevokeCashManager(cm._id)}
                        >
                          Revoke Role
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
                            <h4 className="font-black text-2xl text-gray-900 dark:text-white">{pay.course?.title || pay.bundle?.title || 'Unknown Item'}</h4>
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
                        ✅ Approve
                      </button>
                      <button 
                        onClick={() => handleRejectClick(pay._id)}
                        className="flex-1 bg-red-100 text-red-600 px-10 py-4 rounded-2xl font-black hover:bg-red-200 transition"
                      >
                        ❌ Reject
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
                        <div className="font-bold text-indigo-600 leading-tight">{pay.course?.title || pay.bundle?.title || 'Unknown Item'}</div>
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
              <h3 className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{revenueData?.lifetimeTotal?.toLocaleString()} {revenueData?.currency || settings?.currency || 'ETB'}</h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Platform Fee ({revenueData?.platformCommissionPct ?? (settings?.platformCommissionPercentage || 10)}%)</p>
              <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{(revenueData?.platformFee ?? ((revenueData?.lifetimeTotal || 0) * ((revenueData?.platformCommissionPct ?? (settings?.platformCommissionPercentage || 10)) / 100)))?.toLocaleString()} {revenueData?.currency || settings?.currency || 'ETB'}</h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Instructor Payout ({revenueData?.instructorCommissionPct ?? (100 - (settings?.platformCommissionPercentage || 10))}%)</p>
              <h3 className="text-4xl font-black text-orange-600 dark:text-orange-400">{(revenueData?.instructorFee ?? ((revenueData?.lifetimeTotal || 0) * ((revenueData?.instructorCommissionPct ?? (100 - (settings?.platformCommissionPercentage || 10))) / 100)))?.toLocaleString()} {revenueData?.currency || settings?.currency || 'ETB'}</h3>
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
                      <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400">{m.total.toLocaleString()} {revenueData?.currency || settings?.currency || 'ETB'}</td>
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
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">Price: {course.price} {revenueData?.currency || settings?.currency || 'ETB'}</span>
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
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Platform Settings</h2>
            
            {/* Settings Sub-tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b dark:border-zinc-800 pb-4">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'users', label: 'User Management', icon: Users },
                { id: 'security', label: 'Security', icon: AlertCircle },
                { id: 'payment', label: 'Payment', icon: CreditCard },
                { id: 'course', label: 'Course', icon: BookOpen },
                { id: 'instructor', label: 'Instructor', icon: UserCheck },
                { id: 'affiliate', label: 'Affiliate', icon: BarChart3 },
                { id: 'notification', label: 'Notification', icon: ClipboardCheck },
                { id: 'certificate', label: 'Certificate', icon: Star },
                { id: 'financial', label: 'Financial', icon: RefreshCw },
                { id: 'email', label: 'Email', icon: Mail },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsSubTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all ${
                      settingsSubTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              {settingsSubTab === 'general' && (
                <div className="space-y-6">
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
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Contact Email</label>
                      <input 
                        type="email"
                        value={settings?.siteEmail || ''}
                        onChange={(e) => setSettings({...settings, siteEmail: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Currency</label>
                      <select 
                        value={settings?.currency || 'ETB'}
                        onChange={(e) => setSettings({...settings, currency: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl outline-none dark:text-white"
                      >
                        <option value="ETB">Ethiopian Birr (ETB)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">ETB to USD Rate</label>
                      <input 
                        type="number"
                        value={settings?.etbUsdRate || 150}
                        onChange={(e) => setSettings({...settings, etbUsdRate: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Terms of Service</label>
                    <textarea 
                      value={settings?.termsOfService || ''}
                      onChange={(e) => setSettings({...settings, termsOfService: e.target.value})}
                      rows={4}
                      className="w-full bg-gray-50 dark:bg-zinc- 950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Privacy Policy</label>
                    <textarea 
                      value={settings?.privacyPolicy || ''}
                      onChange={(e) => setSettings({...settings, privacyPolicy: e.target.value})}
                      rows={4}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <div>
                      <h4 className="font-black text-red-900 dark:text-red-400">Maintenance Mode</h4>
                      <p className="text-xs text-red-700 dark:text-red-500">Prevent users from accessing the platform during updates</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                      className={`w-14 h-8 rounded-full transition-all relative ${settings?.maintenanceMode ? 'bg-red-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.maintenanceMode ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {settingsSubTab === 'users' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">User Management Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Student Registration</h4>
                        <p className="text-xs text-gray-500">Allow new student signups</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, allowStudentRegistration: !settings.allowStudentRegistration})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.allowStudentRegistration ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowStudentRegistration ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Instructor Registration</h4>
                        <p className="text-xs text-gray-500">Allow new instructor signups</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, allowInstructorRegistration: !settings.allowInstructorRegistration})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.allowInstructorRegistration ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowInstructorRegistration ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Default User Status</label>
                    <select 
                      value={settings?.defaultUserStatus || 'approved'}
                      onChange={(e) => setSettings({...settings, defaultUserStatus: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl outline-none dark:text-white"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">Email Verification Required</h4>
                      <p className="text-xs text-gray-500">Require email verification before account activation</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, requireEmailVerification: !settings.requireEmailVerification})}
                      className={`w-14 h-8 rounded-full transition-all relative ${settings?.requireEmailVerification ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.requireEmailVerification ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Auto-suspend Inactive Accounts (Days, 0 = disabled)</label>
                    <input 
                      type="number"
                      value={settings?.autoSuspendInactiveDays || 0}
                      onChange={(e) => setSettings({...settings, autoSuspendInactiveDays: Number(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}

              {settingsSubTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Authentication & Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Password Min Length</label>
                      <input 
                        type="number"
                        value={settings?.passwordMinLength || 8}
                        onChange={(e) => setSettings({...settings, passwordMinLength: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Session Timeout (Minutes)</label>
                      <input 
                        type="number"
                        value={settings?.sessionTimeoutMinutes || 1440}
                        onChange={(e) => setSettings({...settings, sessionTimeoutMinutes: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Require Uppercase</h4>
                        <p className="text-xs text-gray-500">Passwords must contain uppercase letters</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, requireUppercase: !settings.requireUppercase})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.requireUppercase ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.requireUppercase ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Require Lowercase</h4>
                        <p className="text-xs text-gray-500">Passwords must contain lowercase letters</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, requireLowercase: !settings.requireLowercase})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.requireLowercase ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.requireLowercase ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Require Numbers</h4>
                        <p className="text-xs text-gray-500">Passwords must contain numbers</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, requireNumbers: !settings.requireNumbers})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.requireNumbers ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.requireNumbers ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Require Special Characters</h4>
                        <p className="text-xs text-gray-500">Passwords must contain special characters</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, requireSpecialChars: !settings.requireSpecialChars})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.requireSpecialChars ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.requireSpecialChars ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">JWT Expiration (Days)</label>
                      <input 
                        type="number"
                        value={settings?.jwtExpirationDays || 30}
                        onChange={(e) => setSettings({...settings, jwtExpirationDays: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Max Login Attempts</label>
                      <input 
                        type="number"
                        value={settings?.maxLoginAttempts || 5}
                        onChange={(e) => setSettings({...settings, maxLoginAttempts: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Two-Factor Auth</h4>
                        <p className="text-xs text-gray-500">Enable 2FA for all users</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, enableTwoFactorAuth: !settings.enableTwoFactorAuth})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.enableTwoFactorAuth ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.enableTwoFactorAuth ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Lockout Duration (Minutes)</label>
                      <input 
                        type="number"
                        value={settings?.lockoutDurationMinutes || 30}
                        onChange={(e) => setSettings({...settings, lockoutDurationMinutes: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'payment' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Payment Settings</h3>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Payment Gateways (Select All That Apply)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'chapa', label: 'Chapa', icon: '💳' },
                        { id: 'paypal', label: 'PayPal', icon: '🅿️' },
                        { id: 'stripe', label: 'Stripe', icon: '💜' },
                        { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
                        { id: 'telebirr', label: 'Telebirr', icon: '📱' },
                      ].map((gateway) => (
                        <div
                          key={gateway.id}
                          onClick={() => {
                            const currentGateways = settings?.paymentGateways || ['chapa'];
                            if (currentGateways.includes(gateway.id)) {
                              setSettings({
                                ...settings,
                                paymentGateways: currentGateways.filter(g => g !== gateway.id)
                              });
                            } else {
                              setSettings({
                                ...settings,
                                paymentGateways: [...currentGateways, gateway.id]
                              });
                            }
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            settings?.paymentGateways?.includes(gateway.id)
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-400'
                              : 'bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{gateway.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-black text-gray-900 dark:text-white">{gateway.label}</h4>
                              {settings?.paymentGateways?.includes(gateway.id) && (
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                  Enabled
                                </span>
                              )}
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              settings?.paymentGateways?.includes(gateway.id)
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-gray-300 dark:border-zinc-600'
                            }`}>
                              {settings?.paymentGateways?.includes(gateway.id) && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Select all payment methods you want to make available to users. Bank and Telebirr are for manual payments.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Chapa API Key</label>
                      <input 
                        type="password"
                        value={settings?.chapaApiKey || ''}
                        onChange={(e) => setSettings({...settings, chapaApiKey: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">PayPal Client ID</label>
                      <input 
                        type="password"
                        value={settings?.paypalClientId || ''}
                        onChange={(e) => setSettings({...settings, paypalClientId: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">PayPal Client Secret</label>
                      <input 
                        type="password"
                        value={settings?.paypalClientSecret || ''}
                        onChange={(e) => setSettings({...settings, paypalClientSecret: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stripe Public Key</label>
                      <input 
                        type="password"
                        value={settings?.stripePublicKey || ''}
                        onChange={(e) => setSettings({...settings, stripePublicKey: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stripe Secret Key</label>
                      <input 
                        type="password"
                        value={settings?.stripeSecretKey || ''}
                        onChange={(e) => setSettings({...settings, stripeSecretKey: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Minimum Withdrawal Amount</label>
                      <input 
                        type="number"
                        value={settings?.minimumWithdrawalAmount || 500}
                        onChange={(e) => setSettings({...settings, minimumWithdrawalAmount: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Platform Commission Percentage</label>
                    <input 
                      type="number"
                      value={settings?.platformCommissionPercentage || 10}
                      onChange={(e) => setSettings({...settings, platformCommissionPercentage: Number(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                    <h4 className="font-black text-gray-900 dark:text-white mb-4">Bank Account Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account Name</label>
                        <input 
                          type="text"
                          value={settings?.bankAccountInfo?.accountName || ''}
                          onChange={(e) => setSettings({...settings, bankAccountInfo: {...(settings.bankAccountInfo || {}), accountName: e.target.value}})}
                          className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account Number</label>
                        <input 
                          type="text"
                          value={settings?.bankAccountInfo?.accountNumber || ''}
                          onChange={(e) => setSettings({...settings, bankAccountInfo: {...(settings.bankAccountInfo || {}), accountNumber: e.target.value}})}
                          className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bank Name</label>
                        <input 
                          type="text"
                          value={settings?.bankAccountInfo?.bankName || ''}
                          onChange={(e) => setSettings({...settings, bankAccountInfo: {...(settings.bankAccountInfo || {}), bankName: e.target.value}})}
                          className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Branch</label>
                        <input 
                          type="text"
                          value={settings?.bankAccountInfo?.branch || ''}
                          onChange={(e) => setSettings({...settings, bankAccountInfo: {...(settings.bankAccountInfo || {}), branch: e.target.value}})}
                          className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'course' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Course Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Require Approval</h4>
                        <p className="text-xs text-gray-500">Courses need admin approval before publishing</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, requireCourseApproval: !settings.requireCourseApproval})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.requireCourseApproval ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.requireCourseApproval ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Auto Publish</h4>
                        <p className="text-xs text-gray-500">Automatically publish courses after creation</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, autoPublishCourses: !settings.autoPublishCourses})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.autoPublishCourses ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.autoPublishCourses ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Minimum Course Price</label>
                      <input 
                        type="number"
                        value={settings?.minimumCoursePrice || 0}
                        onChange={(e) => setSettings({...settings, minimumCoursePrice: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Maximum Course Price</label>
                      <input 
                        type="number"
                        value={settings?.maximumCoursePrice || 100000}
                        onChange={(e) => setSettings({...settings, maximumCoursePrice: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Course Categories (comma-separated)</label>
                    <input 
                      type="text"
                      value={settings?.courseCategories?.join(', ') || ''}
                      onChange={(e) => setSettings({...settings, courseCategories: e.target.value.split(',').map(c => c.trim())})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}

              {settingsSubTab === 'instructor' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Instructor Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Approval Required</h4>
                        <p className="text-xs text-gray-500">Instructors need admin approval</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, instructorApprovalRequired: !settings.instructorApprovalRequired})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.instructorApprovalRequired ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.instructorApprovalRequired ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Verification Required</h4>
                        <p className="text-xs text-gray-500">Require instructor identity verification</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, instructorVerificationRequired: !settings.instructorVerificationRequired})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.instructorVerificationRequired ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.instructorVerificationRequired ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Instructor Commission Percentage</label>
                      <input 
                        type="number"
                        value={settings?.instructorCommissionPercentage || 70}
                        onChange={(e) => setSettings({...settings, instructorCommissionPercentage: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Withdrawal Approval</h4>
                        <p className="text-xs text-gray-500">Require admin approval for withdrawals</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, instructorWithdrawalApproval: !settings.instructorWithdrawalApproval})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.instructorWithdrawalApproval ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.instructorWithdrawalApproval ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'affiliate' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Affiliate Settings</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">Enable Affiliate Program</h4>
                      <p className="text-xs text-gray-500">Allow users to become affiliates</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, enableAffiliateProgram: !settings.enableAffiliateProgram})}
                      className={`w-14 h-8 rounded-full transition-all relative ${settings?.enableAffiliateProgram ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.enableAffiliateProgram ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Affiliate Commission Rate (%)</label>
                      <input 
                        type="number"
                        value={settings?.affiliateCommissionRate || 10}
                        onChange={(e) => setSettings({...settings, affiliateCommissionRate: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Referral Bonus Amount</label>
                      <input 
                        type="number"
                        value={settings?.referralBonusAmount || 100}
                        onChange={(e) => setSettings({...settings, referralBonusAmount: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Minimum Payout Amount</label>
                      <input 
                        type="number"
                        value={settings?.affiliateMinimumPayout || 1000}
                        onChange={(e) => setSettings({...settings, affiliateMinimumPayout: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'notification' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Notification Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Email</h4>
                        <p className="text-xs text-gray-500">Enable email notifications</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, enableEmailNotifications: !settings.enableEmailNotifications})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.enableEmailNotifications ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.enableEmailNotifications ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">SMS</h4>
                        <p className="text-xs text-gray-500">Enable SMS notifications</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, enableSMSNotifications: !settings.enableSMSNotifications})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.enableSMSNotifications ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.enableSMSNotifications ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Push</h4>
                        <p className="text-xs text-gray-500">Enable push notifications</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, enablePushNotifications: !settings.enablePushNotifications})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.enablePushNotifications ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.enablePushNotifications ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Announcement Banner</label>
                    <input 
                      type="text"
                      value={settings?.announcementBanner || ''}
                      onChange={(e) => setSettings({...settings, announcementBanner: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">Show Announcement</h4>
                      <p className="text-xs text-gray-500">Display announcement banner to users</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, announcementActive: !settings.announcementActive})}
                      className={`w-14 h-8 rounded-full transition-all relative ${settings?.announcementActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.announcementActive ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {settingsSubTab === 'certificate' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Certificate Settings</h3>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Certificate Template</label>
                    <input 
                      type="text"
                      value={settings?.certificateTemplate || 'default'}
                      onChange={(e) => setSettings({...settings, certificateTemplate: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Certificate Signature</label>
                    <input 
                      type="text"
                      value={settings?.certificateSignature || 'Platform Administrator'}
                      onChange={(e) => setSettings({...settings, certificateSignature: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Certificate Verification URL</label>
                    <p className="text-xs text-gray-500 mb-2">Domain where certificates can be verified (e.g., oicttutor.com, yoursite.com)</p>
                    <input 
                      type="text"
                      value={settings?.certificateVerificationURL || 'oicttutor.com'}
                      onChange={(e) => setSettings({...settings, certificateVerificationURL: e.target.value})}
                      placeholder="oicttutor.com"
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">Verification Enabled</h4>
                      <p className="text-xs text-gray-500">Allow certificate verification</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, certificateVerificationEnabled: !settings.certificateVerificationEnabled})}
                      className={`w-14 h-8 rounded-full transition-all relative ${settings?.certificateVerificationEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.certificateVerificationEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {settingsSubTab === 'financial' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Financial Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tax Percentage</label>
                      <input 
                        type="number"
                        value={settings?.taxPercentage || 0}
                        onChange={(e) => setSettings({...settings, taxPercentage: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Refund Policy (Days)</label>
                      <input 
                        type="number"
                        value={settings?.refundPolicyDays || 7}
                        onChange={(e) => setSettings({...settings, refundPolicyDays: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Revenue Sharing</h4>
                        <p className="text-xs text-gray-500">Enable revenue sharing with instructors</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, revenueSharingEnabled: !settings.revenueSharingEnabled})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.revenueSharingEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.revenueSharingEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white">Financial Reports</h4>
                        <p className="text-xs text-gray-500">Allow access to financial reports</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, allowFinancialReports: !settings.allowFinancialReports})}
                        className={`w-14 h-8 rounded-full transition-all relative ${settings?.allowFinancialReports ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.allowFinancialReports ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'email' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Email Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">SMTP Host</label>
                      <input 
                        type="text"
                        value={settings?.smtpHost || ''}
                        onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">SMTP Port</label>
                      <input 
                        type="number"
                        value={settings?.smtpPort || 587}
                        onChange={(e) => setSettings({...settings, smtpPort: Number(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">SMTP User</label>
                      <input 
                        type="text"
                        value={settings?.smtpUser || ''}
                        onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">SMTP Password</label>
                      <input 
                        type="password"
                        value={settings?.smtpPassword || ''}
                        onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-800">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">SMTP Secure (SSL/TLS)</h4>
                      <p className="text-xs text-gray-500">Use secure connection for SMTP</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, smtpSecure: !settings.smtpSecure})}
                      className={`w-14 h-8 rounded-full transition-all relative ${settings?.smtpSecure ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.smtpSecure ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">From Name</label>
                      <input 
                        type="text"
                        value={settings?.emailFromName || 'EduPlatform'}
                        onChange={(e) => setSettings({...settings, emailFromName: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">From Address</label>
                      <input 
                        type="email"
                        value={settings?.emailFromAddress || 'noreply@eduplatform.com'}
                        onChange={(e) => setSettings({...settings, emailFromAddress: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Verification Email Template</label>
                    <input 
                      type="text"
                      value={settings?.verificationEmailTemplate || 'default'}
                      onChange={(e) => setSettings({...settings, verificationEmailTemplate: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-3 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={updatingSettings}
                className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {updatingSettings ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </form>
          </div>
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
              <div className="grid gap-8">
                {pendingCourses.map(course => (
                  <div key={course._id} className="bg-gray-50 dark:bg-zinc-950/50 border dark:border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      {/* Video Preview Section */}
                      <div className="lg:w-1/2 bg-black relative">
                        <div className="aspect-video">
                          <VideoPreview
                            videoUrl={course.introVideoUrl}
                            videoSource={course.videoSource}
                            title="Course Preview"
                          />
                        </div>
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                          <span className="text-white font-black text-sm">Preview Video</span>
                        </div>
                      </div>

                      {/* Course Details Section */}
                      <div className="lg:w-1/2 p-8 flex flex-col">
                        <div className="flex-1">
                          <h4 className="font-black text-2xl text-gray-900 dark:text-white mb-4">{course.title}</h4>
                          
                          <div className="space-y-4 mb-6">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{course.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Category</p>
                                <p className="text-sm font-bold text-indigo-600">{course.category}</p>
                              </div>
                              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Level</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{course.level}</p>
                              </div>
                              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Price</p>
                                <p className="text-sm font-bold text-emerald-600">{course.price} {course.currency}</p>
                              </div>
                              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Video Source</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{course.videoSource}</p>
                              </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Instructor Information</p>
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                  <UserCheck className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{course.instructor?.name}</p>
                                  <p className="text-xs text-gray-500">{course.instructor?.email}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border dark:border-zinc-800">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Modules ({course.modules?.length || 0})</p>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {course.modules?.map((mod, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                    {mod.title || `Module ${idx + 1}`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-auto pt-6 border-t dark:border-zinc-800">
                          <button 
                            className="flex-1 h-12 px-6 bg-indigo-600 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                            onClick={() => handleApproveCourse(course._id)}
                          >
                            <CheckCircle className="h-4 w-4" /> Approve & Publish
                          </button>
                          <button 
                            className="flex-1 h-12 px-6 bg-white dark:bg-zinc-900 text-red-600 border border-red-100 dark:border-red-900/30 rounded-xl font-black text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2"
                            onClick={() => handleRejectCourse(course._id)}
                          >
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      </div>
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
                <div className="grid gap-8">
                  {pendingBundles.map(bundle => (
                    <PendingBundleCard
                      key={bundle._id}
                      bundle={bundle}
                      onApprove={() => handleBundleStatus(bundle._id, 'approved')}
                      onReject={() => handleBundleStatus(bundle._id, 'rejected')}
                    />
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

      {/* Categories Management */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Categories Management</h2>
            
            {/* Add Category */}
            <div className="flex gap-4 mb-8">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                className="flex-1 bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
              />
              <button
                onClick={async () => {
                  if (!newCategory.trim()) {
                    alert('Please enter a category name');
                    return;
                  }
                  try {
                    const response = await fetch(`${BASE_URL}/settings`, {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        courseCategories: [...(settings?.courseCategories || []), newCategory.trim()]
                      }),
                    });
                    if (response.ok) {
                      setNewCategory('');
                      await fetchSettings();
                      alert('Category added successfully!');
                    } else {
                      alert('Failed to add category. Please try again.');
                    }
                  } catch (error) {
                    console.error('Error adding category:', error);
                    alert('Error adding category. Please try again.');
                  }
                }}
                className="px-8 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all"
              >
                Add Category
              </button>
            </div>

            {/* Categories List */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(settings?.courseCategories || []).map((category, index) => (
                <div key={index} className="bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between group">
                  <span className="font-black text-gray-900 dark:text-white">{category}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory({ index, value: category })}
                      className="px-3 py-1 text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all uppercase tracking-wider"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const newCategories = settings.courseCategories.filter((_, i) => i !== index);
                          const response = await fetch(`${BASE_URL}/settings`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${user.token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ courseCategories: newCategories }),
                          });
                          if (response.ok) fetchSettings();
                        } catch (error) {
                          console.error('Error deleting category:', error);
                        }
                      }}
                      className="px-3 py-1 text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Category Modal */}
            {editingCategory && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">Edit Category</h3>
                  <input
                    type="text"
                    value={editingCategory.value}
                    onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-xl mb-4 dark:text-white"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        try {
                          const newCategories = [...settings.courseCategories];
                          newCategories[editingCategory.index] = editingCategory.value;
                          const response = await fetch(`${BASE_URL}/settings`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${user.token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ courseCategories: newCategories }),
                          });
                          if (response.ok) {
                            setEditingCategory(null);
                            fetchSettings();
                          }
                        } catch (error) {
                          console.error('Error updating category:', error);
                        }
                      }}
                      className="flex-1 px-6 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="flex-1 px-6 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-black hover:bg-gray-300 dark:hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews & Ratings */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Reviews & Ratings</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review._id} className="border dark:border-zinc-800 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                            {review.user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{review.user?.name}</h4>
                          <p className="text-sm text-gray-500">{review.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">
                        {review.course ? `Course: ${review.course.title}` : review.bundle ? `Bundle: ${review.bundle.title}` : 'Unknown'}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
                      >
                        Delete Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Management */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Notification Management</h2>
            
            {/* Send Notification Form */}
            <div className="bg-gray-50 dark:bg-zinc-950 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Send New Notification</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Notification title"
                  className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                />
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Notification message"
                  rows={3}
                  className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                />
                <select
                  value={newNotification.targetType}
                  onChange={(e) => setNewNotification({ ...newNotification, targetType: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                >
                  <option value="all">All Users</option>
                  <option value="students">All Students</option>
                  <option value="instructors">All Instructors</option>
                  <option value="cashManagers">All Cash Managers</option>
                  <option value="admins">All Admins</option>
                  <option value="superAdmins">All SuperAdmins</option>
                </select>
                <button
                  onClick={async () => {
                    if (!newNotification.title || !newNotification.message) {
                      alert('Please enter title and message');
                      return;
                    }
                    try {
                      const response = await fetch(`${BASE_URL}/notifications/broadcast`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${user.token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newNotification),
                      });
                      if (response.ok) {
                        setNewNotification({ title: '', message: '', targetType: 'all', targetId: null });
                        await fetchNotifications();
                        alert('Notification sent successfully!');
                      } else {
                        const errorData = await response.json();
                        alert('Failed to send notification: ' + (errorData.message || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error sending notification:', error);
                      alert('Error sending notification. Please try again.');
                    }
                  }}
                  className="w-full px-6 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 py-4"
                >
                  Send Notification
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Notification History</h3>
              {notifications.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-zinc-950 rounded-xl">
                  <p className="text-gray-500 font-bold uppercase tracking-widest">No notifications sent yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification._id} className="bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-black text-gray-900 dark:text-white">{notification.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded uppercase tracking-wider">
                          {notification.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingNotification(notification)}
                        className="px-3 py-1 text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all uppercase tracking-wider"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to delete this notification?')) return;
                          try {
                            const response = await fetch(`${BASE_URL}/notifications/${notification._id}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${user.token}` },
                            });
                            if (response.ok) {
                              await fetchNotifications();
                              alert('Notification deleted successfully!');
                            }
                          } catch (error) {
                            alert('Error deleting notification');
                          }
                        }}
                        className="px-3 py-1 text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all uppercase tracking-wider"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Edit Notification Modal */}
            {editingNotification && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">Edit Notification</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingNotification.title}
                      onChange={(e) => setEditingNotification({ ...editingNotification, title: e.target.value })}
                      placeholder="Notification title"
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                    />
                    <textarea
                      value={editingNotification.message}
                      onChange={(e) => setEditingNotification({ ...editingNotification, message: e.target.value })}
                      placeholder="Notification message"
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${BASE_URL}/notifications/${editingNotification._id}`, {
                              method: 'PUT',
                              headers: {
                                'Authorization': `Bearer ${user.token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(editingNotification),
                            });
                            if (response.ok) {
                              setEditingNotification(null);
                              await fetchNotifications();
                              alert('Notification updated successfully!');
                            }
                          } catch (error) {
                            alert('Error updating notification');
                          }
                        }}
                        className="flex-1 px-6 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotification(null)}
                        className="flex-1 px-6 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-black hover:bg-gray-300 dark:hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports & Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Reports & Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30">
                <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Total Students</h4>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{students.length}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30">
                <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Total Instructors</h4>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{instructors.length}</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-6 border border-violet-100 dark:border-violet-900/30">
                <h4 className="text-sm font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">Total Courses</h4>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{allCourses.length}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-900/30">
                <h4 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Total Payments</h4>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{allPayments.length}</p>
              </div>
            </div>

            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-bold uppercase tracking-widest">Detailed analytics coming soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Management */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Certificate Management</h2>
              <button
                onClick={async () => {
                  if (!window.confirm('Clean up duplicate bundle certificates? This will keep only the oldest certificate for each student-bundle pair.')) return;
                  try {
                    const response = await fetch(`${BASE_URL}/quiz/admin/cleanup-duplicate-certificates`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${user.token}` },
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert(`✅ Cleanup completed!\nDuplicates removed: ${data.duplicatesRemoved}\nCertificates kept: ${data.certificatesKept}`);
                      fetchCertificates();
                    } else {
                      alert('Failed to cleanup: ' + data.message);
                    }
                  } catch (error) {
                    console.error('Error cleaning up duplicates:', error);
                    alert('Failed to cleanup duplicates');
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                🧹 Clean Up Duplicates
              </button>
            </div>
            {certificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">No certificates issued yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-zinc-800 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="py-3 pr-4">Certificate Number</th>
                      <th className="py-3 pr-4">Student</th>
                      <th className="py-3 pr-4">Course/Bundle</th>
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 pr-4">Issue Date</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map(cert => (
                      <tr key={cert._id} className="border-b dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 font-mono text-sm text-indigo-600 dark:text-indigo-400">{cert.certificateNumber}</td>
                        <td className="py-4">
                          <div className="font-bold text-gray-900 dark:text-white">{cert.user?.name}</div>
                          <div className="text-xs text-gray-500">{cert.user?.email}</div>
                        </td>
                        <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                          {cert.course ? cert.course.title : cert.bundle ? cert.bundle.title : 'Unknown'}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                            cert.type === 'bundle' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {cert.type === 'bundle' ? 'Bundle' : 'Course'}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-500">{new Date(cert.issueDate).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                            cert.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {cert.status === 'active' ? (
                              <button
                                onClick={() => handleRevokeCertificate(cert._id, cert.type)}
                                className="px-3 py-1 text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all uppercase tracking-wider"
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateCertificate(cert._id, cert.type)}
                                className="px-3 py-1 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-all uppercase tracking-wider"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteCertificate(cert._id, cert.type)}
                              className="px-3 py-1 text-xs font-black text-gray-600 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-all uppercase tracking-wider"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Announcement Management - SuperAdmin Only */}
      {activeTab === 'announcements' && user?.role === 'superAdmin' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Announcement Management</h2>
            
            {/* Create Announcement */}
            <div className="bg-gray-50 dark:bg-zinc-950 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Create Announcement</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Announcement title"
                  className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                />
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  placeholder="Announcement message"
                  rows={3}
                  className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                />
                <div>
                  <label className="block text-sm font-black text-gray-900 dark:text-white mb-2">Schedule For (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newAnnouncement.scheduledFor || ''}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, scheduledFor: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newAnnouncement.title || !newAnnouncement.message) {
                      alert('Please enter title and message');
                      return;
                    }
                    try {
                      const response = await fetch(`${BASE_URL}/admin/announcements`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${user.token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          ...newAnnouncement,
                          scheduledFor: newAnnouncement.scheduledFor ? new Date(newAnnouncement.scheduledFor).toISOString() : null
                        }),
                      });
                      if (response.ok) {
                        setNewAnnouncement({ title: '', message: '', scheduledFor: null });
                        await fetchAnnouncements();
                        alert('Announcement created successfully!');
                      } else {
                        const errorData = await response.json();
                        alert('Failed to create announcement: ' + (errorData.message || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error creating announcement:', error);
                      alert('Error creating announcement. Please try again.');
                    }
                  }}
                  className="w-full px-6 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 py-4"
                >
                  Create Announcement
                </button>
              </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Existing Announcements</h3>
              {announcements.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-zinc-950 rounded-xl">
                  <p className="text-gray-500 font-bold uppercase tracking-widest">No announcements yet</p>
                </div>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement._id} className="bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-black text-gray-900 dark:text-white">{announcement.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{announcement.message}</p>
                      {announcement.scheduledFor && (
                        <p className="text-xs text-indigo-600 mt-2">Scheduled: {new Date(announcement.scheduledFor).toLocaleString()}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded uppercase tracking-wider">
                          {announcement.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(announcement.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${BASE_URL}/admin/announcements/${announcement._id}/send`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${user.token}`,
                                'Content-Type': 'application/json',
                              },
                            });
                            if (response.ok) {
                              await fetchAnnouncements();
                              alert('Announcement sent successfully!');
                            }
                          } catch (error) {
                            alert('Error sending announcement');
                          }
                        }}
                        className="px-3 py-1 text-xs font-black text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all uppercase tracking-wider"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setEditingAnnouncement(announcement)}
                        className="px-3 py-1 text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all uppercase tracking-wider"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to delete this announcement?')) return;
                          try {
                            const response = await fetch(`${BASE_URL}/admin/announcements/${announcement._id}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${user.token}` },
                            });
                            if (response.ok) {
                              await fetchAnnouncements();
                              alert('Announcement deleted successfully!');
                            }
                          } catch (error) {
                            alert('Error deleting announcement');
                          }
                        }}
                        className="px-3 py-1 text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all uppercase tracking-wider"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Edit Announcement Modal */}
            {editingAnnouncement && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">Edit Announcement</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingAnnouncement.title}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                      placeholder="Announcement title"
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                    />
                    <textarea
                      value={editingAnnouncement.message}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                      placeholder="Announcement message"
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                    />
                    <div>
                      <label className="block text-sm font-black text-gray-900 dark:text-white mb-2">Schedule For (Optional)</label>
                      <input
                        type="datetime-local"
                        value={editingAnnouncement.scheduledFor ? editingAnnouncement.scheduledFor.slice(0, 16) : ''}
                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, scheduledFor: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-zinc-950 border dark:border-zinc-800 p-4 rounded-xl dark:text-white"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${BASE_URL}/admin/announcements/${editingAnnouncement._id}`, {
                              method: 'PUT',
                              headers: {
                              'Authorization': `Bearer ${user.token}`,
                              'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                              ...editingAnnouncement,
                              scheduledFor: editingAnnouncement.scheduledFor ? new Date(editingAnnouncement.scheduledFor).toISOString() : null
                              }),
                            });
                            if (response.ok) {
                              setEditingAnnouncement(null);
                              await fetchAnnouncements();
                              alert('Announcement updated successfully!');
                            }
                          } catch (error) {
                            alert('Error updating announcement');
                          }
                        }}
                        className="flex-1 px-6 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAnnouncement(null)}
                        className="flex-1 px-6 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-black hover:bg-gray-300 dark:hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Content Moderation */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Content Moderation</h2>
            {moderationContent.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">No moderation reports</p>
              </div>
            ) : (
              <div className="space-y-4">
                {moderationContent.map(report => (
                  <div key={report._id} className="border dark:border-zinc-800 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all">
                    {/* Report Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                            report.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            report.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                            report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status}
                          </span>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">{report.contentType}</span>
                        </div>
                        <p className="font-black text-lg text-red-600 dark:text-red-400 mb-1">Reason: {report.reason}</p>
                        {report.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">"{report.description}"</p>
                        )}
                        {report.reportedBy && (
                          <div className="flex items-center gap-2 mt-2">
                            {report.reportedBy.image && (
                              <img src={report.reportedBy.image} alt={report.reportedBy.name} className="w-6 h-6 rounded-full" />
                            )}
                            <p className="text-sm text-gray-500">
                              Reported by: <span className="font-bold">{report.reportedBy.name}</span> ({report.reportedBy.email})
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Content Details Section */}
                    {report.contentDetails ? (
                      <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                        <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 mb-3 uppercase">Reported Content Details</h4>
                        
                        {/* Course/Bundle Details */}
                        {(report.contentType === 'course' || report.contentType === 'bundle') && (
                          <div className="space-y-2">
                            <div className="flex items-start gap-4">
                              {report.contentDetails.thumbnail && (
                                <img 
                                  src={report.contentDetails.thumbnail} 
                                  alt={report.contentDetails.title}
                                  className="w-24 h-16 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-black text-gray-900 dark:text-white text-lg mb-1">{report.contentDetails.title}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{report.contentDetails.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{report.contentDetails.category}</span>
                                  <span className="text-xs font-bold text-emerald-600">${report.contentDetails.price}</span>
                                  {report.contentType === 'bundle' && report.contentDetails.courses && (
                                    <span className="text-xs font-bold text-amber-600">{report.contentDetails.courses.length} Courses</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {report.contentDetails.instructor && (
                              <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                                <div className="flex items-center gap-2">
                                  {report.contentDetails.instructor.image && (
                                    <img 
                                      src={report.contentDetails.instructor.image} 
                                      alt={report.contentDetails.instructor.name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Created by:</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{report.contentDetails.instructor.name}</p>
                                    <p className="text-xs text-gray-500">{report.contentDetails.instructor.email}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Review Details */}
                        {report.contentType === 'review' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-yellow-500">{'★'.repeat(report.contentDetails.rating)}</span>
                              <span className="text-gray-400">{'★'.repeat(5 - report.contentDetails.rating)}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{report.contentDetails.comment}"</p>
                            {report.contentDetails.course && (
                              <p className="text-xs text-gray-500 mt-2">On course: <span className="font-bold">{report.contentDetails.course.title}</span></p>
                            )}
                            {report.contentDetails.user && (
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                                {report.contentDetails.user.image && (
                                  <img src={report.contentDetails.user.image} alt={report.contentDetails.user.name} className="w-6 h-6 rounded-full" />
                                )}
                                <p className="text-xs text-gray-600">
                                  By: <span className="font-bold">{report.contentDetails.user.name}</span> ({report.contentDetails.user.email})
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Comment Details */}
                        {report.contentType === 'comment' && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">"{report.contentDetails.text}"</p>
                            {report.contentDetails.course && (
                              <p className="text-xs text-gray-500">On course: <span className="font-bold">{report.contentDetails.course.title}</span></p>
                            )}
                            {report.contentDetails.user && (
                              <div className="flex items-center gap-2 mt-2">
                                {report.contentDetails.user.image && (
                                  <img src={report.contentDetails.user.image} alt={report.contentDetails.user.name} className="w-6 h-6 rounded-full" />
                                )}
                                <p className="text-xs text-gray-600">
                                  By: <span className="font-bold">{report.contentDetails.user.name}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* User Details */}
                        {report.contentType === 'user' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              {report.contentDetails.image && (
                                <img src={report.contentDetails.image} alt={report.contentDetails.name} className="w-12 h-12 rounded-full" />
                              )}
                              <div>
                                <p className="font-black text-gray-900 dark:text-white">{report.contentDetails.name}</p>
                                <p className="text-sm text-gray-600">{report.contentDetails.email}</p>
                                <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{report.contentDetails.role}</span>
                              </div>
                            </div>
                            {report.contentDetails.bio && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{report.contentDetails.bio}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                        <p className="text-sm text-gray-500 italic">Content no longer exists or could not be loaded</p>
                      </div>
                    )}

                    {report.actionTaken && report.actionTaken !== 'none' && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">Action Taken: {report.actionTaken}</p>
                      </div>
                    )}
                    {report.notes && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Admin Notes:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{report.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              const notes = prompt('Enter notes (optional):');
                              handleUpdateModeration(report._id, 'reviewed', 'warning', notes);
                            }}
                            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-200 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Enter notes (optional):');
                              handleUpdateModeration(report._id, 'resolved', 'none', notes);
                            }}
                            className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteModerationReport(report._id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enrollment Management */}
      {activeTab === 'enrollments' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Enrollment Management</h2>
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest">No enrollments yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-zinc-800 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="py-3 pr-4">Student</th>
                      <th className="py-3 pr-4">Course/Bundle</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Enrolled Date</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(enrollment => (
                      <tr key={enrollment._id} className="border-b dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-gray-900 dark:text-white">{enrollment.user?.name}</div>
                          <div className="text-xs text-gray-500">{enrollment.user?.email}</div>
                        </td>
                        <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                          {enrollment.course ? enrollment.course.title : enrollment.bundle ? enrollment.bundle.title : 'Unknown'}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                            enrollment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                            enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            enrollment.status === 'dropped' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-500">{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteEnrollment(enrollment._id)}
                            className="px-3 py-1 text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all uppercase tracking-wider"
                          >
                            Delete
                          </button>
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

      {/* === Reject Payment Modal === */}
      {rejectPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRejectPaymentId(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border dark:border-zinc-800 p-8 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">❌ Reject Payment</h2>
            <p className="text-gray-500 text-sm mb-6">This rejection reason will be sent to the student as a notification so they understand why their payment was declined.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (e.g. Invalid transaction ID, screenshot unclear, etc.)..."
              rows={4}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white resize-none focus:border-red-500 outline-none transition-all font-medium"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectPaymentId(null)} className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-white rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
                Cancel
              </button>
              <button onClick={handleConfirmReject} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition shadow-lg shadow-red-500/20">
                Confirm Reject & Notify Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;