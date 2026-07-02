import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  ClipboardList, 
  GraduationCap, 
  Plus, 
  Trash2, 
  X, 
  Users, 
  Settings, 
  Search, 
  Mail, 
  Calendar, 
  Tag, 
  Clock, 
  Award,
  ChevronRight,
  UserPlus,
  ShieldCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';
import BASE_URL from '../api/config';

const InstructorCoursesPage = () => {
  const { user, refreshProfile } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses'); // courses, settings

  // Form states for creating a course
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [level, setLevel] = useState('All Levels');
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('ETB');
  const [isPaid, setIsPaid] = useState(false);
  const [image, setImage] = useState('');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modTitle, setModTitle] = useState('');
  const [modVideo, setModVideo] = useState('');
  const [modContent, setModContent] = useState(''); // For PDF/Docs
  const [modIsReleased, setModIsReleased] = useState(true); // Release toggle
  const [modDripDelay, setModDripDelay] = useState(0); // Drip logic
  
  // Cohort states
  const [showCohortForm, setShowCohortForm] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortStartDate, setCohortStartDate] = useState('');
  const [cohortEndDate, setCohortEndDate] = useState('');
  const [myCohorts, setMyCohorts] = useState([]);
  const [studentToAssign, setStudentToAssign] = useState('');

  // Advanced Management States
  const [showManagementView, setShowManagementView] = useState(false);
  const [managementCourse, setManagementCourse] = useState(null);
  const [managementTab, setManagementTab] = useState('students'); // students, coupons, assignments
  const [studentsList, setStudentsList] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Grading states
  const [showGradingDesk, setShowGradingDesk] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [submissionsForGrading, setSubmissionsForGrading] = useState([]);
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '' });

  // New Coupon Form
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountAmount: 0,
    expiryDate: '',
    usageLimit: 100
  });

  // New Assignment Form
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    module: 1,
    points: 100,
    dueDate: '',
    questions: []
  });

  const fetchManagementData = async () => {
    if (!managementCourse || !user) return;
    setLoadingAction(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      
      if (managementTab === 'students') {
        const { data } = await axios.get(`${BASE_URL}/enrollments/course/${managementCourse._id}/students`, cfg);
        setStudentsList(data);
      } else if (managementTab === 'coupons') {
        const { data } = await axios.get(`${BASE_URL}/lms/coupons`, cfg);
        // Filter to show only if it matches course or is global
        setCouponsList(data.filter(c => !c.course || c.course._id === managementCourse._id));
      } else if (managementTab === 'assignments') {
        const { data } = await axios.get(`${BASE_URL}/lms/courses/${managementCourse._id}/assignments`, cfg);
        setAssignmentsList(data);
      } else if (managementTab === 'cohorts') {
        const { data: cData } = await axios.get(`${BASE_URL}/cohorts/course/${managementCourse._id}`, cfg);
        setMyCohorts(cData);
        const { data: sData } = await axios.get(`${BASE_URL}/enrollments/course/${managementCourse._id}/students`, cfg);
        setStudentsList(sData);
      }
    } catch (err) {
      console.error('Fetch management data failed:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    if (showManagementView && managementCourse) {
      fetchManagementData();
    }
  }, [showManagementView, managementCourse, managementTab]);

  const handleManualEnroll = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setLoadingAction(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/enrollments/manual`, { 
        email: searchEmail, 
        courseId: managementCourse._id 
      }, cfg);
      setSearchEmail('');
      alert('Student enrolled successfully');
      fetchManagementData();
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUnenroll = async (userId) => {
    if (!window.confirm('Revoke access for this student?')) return;
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${BASE_URL}/enrollments/manual/${managementCourse._id}/${userId}`, cfg);
      fetchManagementData();
    } catch (err) {
      alert('Failed to unenroll');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/lms/coupons`, { 
        ...couponForm, 
        courseId: managementCourse._id 
      }, cfg);
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountAmount: 0,
        expiryDate: '',
        usageLimit: 100
      });
      alert('Coupon created!');
      fetchManagementData();
    } catch (err) {
      alert('Failed to create coupon');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/lms/assignments`, { 
        ...assignmentForm, 
        courseId: managementCourse._id 
      }, cfg);
      setAssignmentForm({
        title: '',
        description: '',
        module: 1,
        points: 100,
        dueDate: ''
      });
      alert('Assignment added!');
      fetchManagementData();
    } catch (err) {
      alert('Failed to create assignment');
    } finally {
      setLoadingAction(false);
    }
  };

  const fetchSubmissionsForGrading = async (asgn) => {
    setGradingAssignment(asgn);
    setLoadingAction(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/lms/assignments/${asgn._id}/submissions`, cfg);
      setSubmissionsForGrading(data);
      setShowGradingDesk(true);
    } catch (err) {
      alert('Failed to fetch submissions');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGradeSubmission = async (e, subId) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/lms/submissions/${subId}/grade`, gradeForm, cfg);
      alert('Graded successfully!');
      // Refresh current desk
      const res = await axios.get(`${BASE_URL}/lms/assignments/${gradingAssignment._id}/submissions`, cfg);
      setSubmissionsForGrading(res.data);
      setGradeForm({ score: 0, feedback: '' });
    } catch (err) {
      alert('Failed to save grade');
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data: coursesData } = await axios.get(`${BASE_URL}/courses/instructor/mycourses`, config);
        setCourses(coursesData);
        
        // Fetch all cohorts managed by this instructor
        try {
           const { data: cohortsData } = await axios.get(`${BASE_URL}/cohorts`, config);
           setMyCohorts(cohortsData);
        } catch (cErr) {
           console.log('No cohorts found or endpoint missing yet');
        }
      } catch (error) {
        console.error('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const syncAndFetch = async () => {
      setLoading(true);
      // Refresh profile to get latest status (e.g. from pending to approved)
      const updatedUser = await refreshProfile();
      
      const currentUser = updatedUser || user;

      if (currentUser && currentUser.role === 'instructor' && currentUser.status === 'approved') {
        await fetchData();
      } else {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'instructor') {
      syncAndFetch();
    } else {
      setLoading(false);
    }
  }, [user?.token]); // Removed refreshProfile to fix infinite loop

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } };
      const finalPrice = isPaid ? price : 0;
      const courseData = {
        title, 
        description, 
        category,
        price: finalPrice, 
        currency,
        image,
        introVideoUrl,
        isPaid: isPaid,
        videoSource: isPaid ? 'googledrive' : 'youtube',
        level
      };

      let data;
      if (selectedCourse) {
        // Update existing course
        const { data: updatedCourse } = await axios.put(
          `${BASE_URL}/courses/${selectedCourse._id}`, 
          courseData, 
          config
        );
        data = updatedCourse;
        // Update the course in the list
        setCourses(courses.map(course => 
          course._id === selectedCourse._id ? data : course
        ));
        setSelectedCourse(null);
        alert('Course updated successfully!');
      } else {
        // Create new course
        const response = await axios.post(`${BASE_URL}/courses`, courseData, config);
        data = response.data;
        setCourses([...courses, data]);
        alert('Course created successfully!');
      }
      
      setShowForm(false);
      // Reset form
      setTitle(''); 
      setDescription('');
      setCategory('General');
      setLevel('All Levels');
      setPrice(0); 
      setCurrency('ETB');
      setIsPaid(false);
      setImage('');
      setIntroVideoUrl('');
      setSelectedCourse(null);
    } catch (error) {
      console.error(error);
      alert(`Failed to ${selectedCourse ? 'update' : 'create'} course`);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/courses/${selectedCourse._id}/modules`, {
        title: modTitle, 
        videoUrl: modVideo || selectedCourse.introVideoUrl,
        content: modContent,
        dripDelayDays: modDripDelay,
        isReleased: modIsReleased
      }, config);
      alert('Module added!');
      setModTitle(''); setModVideo(''); setModContent(''); setModIsReleased(true); setModDripDelay(0); setSelectedCourse(null);
      // Refresh courses
      const { data } = await axios.get(`${BASE_URL}/courses/instructor/mycourses`, config);
      setCourses(data);
    } catch (error) {
      alert('Failed to add module');
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/cohorts`, {
        name: cohortName,
        courseId: selectedCourse._id,
        startDate: cohortStartDate,
        endDate: cohortEndDate
      }, config);
      
      setMyCohorts([...myCohorts, data]);
      setCohortName('');
      setCohortStartDate('');
      setCohortEndDate('');
      setShowCohortForm(false);
      setSelectedCourse(null);
      alert('Cohort created successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to create cohort');
    }
  };

  const handleAssignToCohort = async (cohortId, studentId) => {
    if (!studentId) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/cohorts/${cohortId}/students`, { studentId }, config);
      alert('Student assigned to cohort!');
      setStudentToAssign('');
      fetchManagementData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign student');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`${BASE_URL}/courses/${courseId}`, config);
        // Remove the course from the list
        setCourses(courses.filter(course => course._id !== courseId));
        alert('Course deleted successfully');
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course');
      }
    }
  };

  const handleEditCourse = (course) => {
    // Set form values for editing
    setTitle(course.title);
    setDescription(course.description);
    setCategory(course.category || 'General');
    setLevel(course.level || 'All Levels');
    setPrice(course.price || 0);
    setCurrency(course.currency || 'ETB');
    setIsPaid(course.price > 0 ? true : false); // Set isPaid based on price
    setImage(course.image);
    setIntroVideoUrl(course.introVideoUrl);
    setSelectedCourse(course);
    setShowForm(true);
  };

  if (!user || user.role !== 'instructor') return <div>Unauthorized</div>;

  // Show pending approval message if instructor is not approved
  if (user.status !== 'approved') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">Approval Pending</h2>
            <p className="text-yellow-700 mb-6">
              Your instructor account is pending admin approval. You will be able to create and manage courses once your account is approved by an administrator.
            </p>
            <div className="text-sm text-yellow-600">
              <p>Status: <span className="font-semibold">{user.status}</span></p>
              <p className="mt-2">You will receive a notification once your account is approved.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                Instructor Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                Manage and publish your courses
              </p>
            </div>
            
            <div className="flex bg-gray-200/50 dark:bg-zinc-800/50 p-1 rounded-xl">
               <button onClick={() => setActiveTab('courses')} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'courses' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Courses</button>
               <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Settings & Privacy</button>
            </div>

            {activeTab === 'courses' && (
              <div className="flex items-center gap-4">
                <Link to="/instructor/bundles" className="px-6 py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Bundles
                </Link>
                <button 
                  onClick={() => {
                  console.log('Create New Course button clicked, current showForm:', showForm);
                  if (showForm) {
                    setShowForm(false);
                    setSelectedCourse(null);
                    // Reset form
                    setTitle('');
                    setDescription('');
                    setCategory('General');
                    setLevel('All Levels');
                    setPrice(0);
                    setCurrency('ETB');
                    setIsPaid(false);
                    setImage('');
                    setIntroVideoUrl('');
                  } else {
                    setShowForm(true);
                  }
                }} 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                {showForm ? '✕ Cancel' : '+ Create New Course'}
              </button>
            </div>
            )}
          </div>
        </div>

        {activeTab === 'settings' ? (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden mt-8">
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
        ) : (
          <>
            {/* Stats Card - Only show when not in form mode */}
            {!showForm && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl p-8 md:p-12 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-semibold opacity-90 mb-2">Total Published Courses</p>
                  <p className="text-7xl md:text-8xl font-black tracking-tight">{courses.length}</p>
                  <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider border border-white/30">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Live on Platform
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
                  <p className="text-lg font-semibold mb-4">Ready to share your knowledge?</p>
                  <button 
                    onClick={() => setShowForm(true)} 
                    className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Create Your First Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {showForm && !selectedCourse && (
        <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-2xl mb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Create New Course</h2>
            <p className="text-gray-600 dark:text-gray-400">Fill in the details below to publish your course</p>
          </div>
          <form onSubmit={handleCreateCourse} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Course Title</label>
              <input 
                type="text"
                required 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                placeholder="Enter course title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Course Description</label>
              <textarea 
                required 
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
                rows="4"
                className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Describe your course"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select 
                required
                value={category} 
                onChange={e=>setCategory(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="General">General</option>
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
                <option value="Photography">Photography</option>
                <option value="Music">Music</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Language">Language</option>
                <option value="Science">Science</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Level</label>
              <select 
                required
                value={level} 
                onChange={e=>setLevel(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Course Type</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer p-3 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex-1">
                  <input 
                    type="radio" 
                    name="courseType" 
                    checked={!isPaid}
                    onChange={() => setIsPaid(false)}
                    className="mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Free (YouTube videos)</span>
                </label>
                <label className="flex items-center cursor-pointer p-3 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex-1">
                  <input 
                    type="radio" 
                    name="courseType" 
                    checked={isPaid}
                    onChange={() => setIsPaid(true)}
                    className="mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Paid (Google Drive videos)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {isPaid ? 'Paid courses use private Google Drive videos for security' : 'Free courses use public YouTube videos'}
              </p>
            </div>
            
            {isPaid && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price</label>
                  <input 
                    type="number" 
                    required 
                    value={price} 
                    onChange={e=>setPrice(e.target.value)} 
                    className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <select 
                    value={currency} 
                    onChange={e=>setCurrency(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="ETB">Ethiopian Birr (ETB)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Course Image URL</label>
              <input 
                type="url"
                required 
                value={image} 
                onChange={e=>setImage(e.target.value)} 
                className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This is the course thumbnail/cover image, not a video</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {isPaid ? 'Intro Video (Google Drive)' : 'Intro Video (YouTube/Social Media)'}
              </label>
              <input 
                type="url"
                required 
                value={introVideoUrl} 
                onChange={e=>setIntroVideoUrl(e.target.value)} 
                className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                placeholder={isPaid 
                  ? "https://drive.google.com/file/d/your-video-id/view" 
                  : "https://www.youtube.com/watch?v=... or other social media video link"
                }
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {isPaid 
                  ? 'Upload your intro video to Google Drive and paste the shareable link here'
                  : 'Paste your YouTube, Facebook, Instagram, or other social media video link here'
                }
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 px-6 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
              >
                Publish Course
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCourse && showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Course: {selectedCourse.title}</h2>
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title</label>
                <input 
                  type="text"
                  required 
                  value={title} 
                  onChange={e=>setTitle(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Enter course title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Course Description</label>
                <textarea 
                  required 
                  value={description} 
                  onChange={e=>setDescription(e.target.value)} 
                  rows="3"
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your course"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select 
                  required
                  value={category} 
                  onChange={e=>setCategory(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="General">General</option>
                  <option value="Programming">Programming</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Photography">Photography</option>
                  <option value="Music">Music</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Language">Language</option>
                  <option value="Science">Science</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                <select 
                  required
                  value={level} 
                  onChange={e=>setLevel(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Course Image URL</label>
                <input 
                  type="url"
                  required 
                  value={image} 
                  onChange={e=>setImage(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="https://example.com/course-thumbnail.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Intro Video URL</label>
                <input 
                  type="url"
                  required 
                  value={introVideoUrl} 
                  onChange={e=>setIntroVideoUrl(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              {isPaid && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                      <input 
                        type="number" 
                        required 
                        value={price} 
                        onChange={e=>setPrice(e.target.value)} 
                        className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                      <select 
                        value={currency} 
                        onChange={e=>setCurrency(e.target.value)}
                        className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ETB">Ethiopian Birr (ETB)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setSelectedCourse(null);
                    setTitle('');
                    setDescription('');
                    setCategory('General');
                    setPrice(0);
                    setCurrency('ETB');
                    setIsPaid(false);
                    setImage('');
                    setIntroVideoUrl('');
                  }} 
                  className="flex-1 py-2 bg-gray-300 text-gray-800 rounded-xl font-bold hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700"
                >
                  Update Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-zinc-700 to-transparent"></div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            My Published Courses
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-zinc-700 to-transparent"></div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-xl text-gray-900 dark:text-white font-bold">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-gray-300 dark:border-zinc-800">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No courses published yet</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start creating your first course to share your knowledge with students</p>
            <button 
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course._id} className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <div className="relative overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {course.price === 0 ? 'Free' : `${course.currency || 'ETB'} ${course.price}`}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {course.modules?.length || 0} Modules
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => { setSelectedCourse(course); setShowForm(false); }}
                        className="w-full py-2.5 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-bold"
                      >
                        + Module
                      </button>
                      <button 
                         onClick={() => { setManagementCourse(course); setShowManagementView(true); setManagementTab('students'); }}
                         className="w-full py-2.5 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition font-bold flex items-center justify-center gap-2"
                       >
                         <Settings className="h-4 w-4" /> Manage
                       </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => { setSelectedCourse(course); setShowCohortForm(true); setShowForm(false); }}
                         className="w-full py-2 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition font-semibold text-center"
                       >
                         + Cohort
                       </button>
                       <Link 
                        to={`/instructor/quiz-builder/${course._id}`}
                        className="w-full py-2 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition font-semibold flex items-center justify-center text-center"
                      >
                        Quiz Builder
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        to={`/peer-review/${course._id}`}
                        className="w-full py-2 text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition font-semibold flex items-center justify-center text-center"
                      >
                        Peer Reviews
                      </Link>
                       <button 
                        onClick={() => handleEditCourse(course)}
                        className="w-full py-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <Link 
                        to={`/courses/${course._id}`} 
                        className="py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition font-semibold text-center"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => handleDeleteCourse(course._id)}
                        className="py-2.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCourse && !showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            <h2 className="text-xl font-black mb-4 text-gray-800">Add Module to {selectedCourse.title}</h2>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg hidden md:block">
              <p className="text-sm text-blue-800">
                <strong>Source:</strong> {selectedCourse.isPaid ? 'Google Drive' : 'YouTube'}
              </p>
            </div>

            <form onSubmit={handleAddModule} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Module Title</label>
                <input 
                  required 
                  value={modTitle} 
                  onChange={e=>setModTitle(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g., Psychology Part 2..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Part Video URL</label>
                <input 
                  value={modVideo} 
                  onChange={e=>setModVideo(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder={selectedCourse?.isPaid ? "https://drive.google.com/..." : "https://youtube.com/..."}
                />
                <p className="text-xs text-blue-600 mt-1 font-medium">Link specifically for this part. (If left blank, the course Intro Video will be used).</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Document/PDF URL (Optional)</label>
                <input 
                  value={modContent} 
                  onChange={e=>setModContent(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="https://link-to-your-pdf-or-notion-doc.com" 
                />
                <p className="text-xs text-gray-500 mt-1">Provide a link to reading material, slides, or a PDF.</p>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <input 
                  type="checkbox" 
                  id="releaseMod"
                  checked={modIsReleased}
                  onChange={e => setModIsReleased(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="releaseMod" className="text-sm font-bold text-gray-700">
                  Release Module to Students
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Content Pacing / Drip Delay</label>
                <div className="relative">
                  <input 
                    type="number"
                    min="0"
                    value={modDripDelay} 
                    onChange={e=>setModDripDelay(e.target.value)} 
                    className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                    placeholder="0" 
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm font-bold bg-gray-100 px-3 py-1 rounded-md">Days</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  <strong>0</strong> = Unlocks immediately when the Cohort starts.<br/>
                  <strong>7</strong> = Unlocks 7 days after the Cohort starts, etc.
                </p>
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2 border-t mt-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setSelectedCourse(null)} 
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCohortForm && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Establish Cohort: {selectedCourse.title}</h2>
            
            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Cohort Identifier (e.g. "Spring 2024 - Group A")</label>
                <input 
                  required 
                  value={cohortName} 
                  onChange={e=>setCohortName(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Enter unique cohort name" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Launch Date</label>
                <input 
                  type="date"
                  required 
                  value={cohortStartDate} 
                  onChange={e=>setCohortStartDate(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                <input 
                  type="date"
                  required 
                  value={cohortEndDate} 
                  onChange={e=>setCohortEndDate(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowCohortForm(false); setSelectedCourse(null); }} 
                  className="flex-1 py-3 bg-gray-300 text-gray-800 rounded-xl font-bold hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Launch Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showManagementView && managementCourse && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-950/50">
               <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <Settings className="h-8 w-8 text-indigo-600" />
                    Manage: {managementCourse.title}
                  </h2>
                  <p className="text-gray-500 font-medium">Control enrollment, pricing, and assessments.</p>
               </div>
               <button 
                onClick={() => setShowManagementView(false)}
                className="p-3 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
               >
                 <X className="h-6 w-6 text-gray-400" />
               </button>
            </div>

            {/* Tabs */}
            <div className="flex px-8 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
               <button 
                onClick={() => setManagementTab('cohorts')}
                className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'cohorts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
               >
                 <Users className="h-5 w-5" /> Cohort Strategy
               </button>
               <button 
                onClick={() => setManagementTab('students')}
                className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
               >
                 <Users className="h-5 w-5" /> Student Roster
               </button>
               <button 
                onClick={() => setManagementTab('coupons')}
                className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
               >
                 <Ticket className="h-5 w-5" /> Course Pricing
               </button>
               <button 
                onClick={() => setManagementTab('assignments')}
                className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
               >
                 <ClipboardList className="h-5 w-5" /> Assignments
               </button>
            </div>

            {/* Modal Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
               {managementTab === 'cohorts' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30">
                       <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
                         <Users className="h-5 w-5" /> Manage Batches / Cohorts
                       </h3>
                       {myCohorts.length === 0 ? (
                         <div className="text-center py-10">
                            <p className="text-gray-500 font-bold">No cohorts created yet. Close this panel and click "+ Cohort" to make one.</p>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            {myCohorts.map(cohort => (
                              <div key={cohort._id} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
                                  <div>
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white">{cohort.name}</h4>
                                    <p className="text-sm text-gray-500 font-medium">
                                      {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                    {cohort.students?.length || 0} Students
                                  </div>
                                </div>
                                
                                {/* Assign Student to this Cohort */}
                                <div className="flex gap-3">
                                  <select 
                                    value={studentToAssign}
                                    onChange={(e) => setStudentToAssign(e.target.value)}
                                    className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white"
                                  >
                                    <option value="">Select Enrolled Student to Add...</option>
                                    {studentsList.map(item => (
                                      <option key={item.user?._id} value={item.user?._id}>{item.user?.name} ({item.user?.email})</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleAssignToCohort(cohort._id, studentToAssign)}
                                    disabled={!studentToAssign}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                                  >
                                    Assign
                                  </button>
                                </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {managementTab === 'students' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30">
                       <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
                         <UserPlus className="h-5 w-5" /> Manual Enrollment
                       </h3>
                       <form onSubmit={handleManualEnroll} className="flex gap-3">
                          <div className="relative flex-1">
                             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                             <input 
                              type="email"
                              required
                              value={searchEmail}
                              onChange={(e) => setSearchEmail(e.target.value)}
                              placeholder="Enter student email to enroll..."
                              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
                             />
                          </div>
                          <button 
                            disabled={loadingAction}
                            type="submit"
                            className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                          >
                            {loadingAction ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                            Grant Access
                          </button>
                       </form>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Students ({studentsList.length})</h3>
                       {studentsList.length === 0 ? (
                         <div className="text-center py-20 bg-gray-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-xl">No students enrolled yet.</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studentsList.map(item => (
                              <div key={item.user?._id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between group hover:border-indigo-500 transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-100">
                                       <img src={item.user?.image || 'https://via.placeholder.com/150'} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                       <p className="font-black text-gray-900 dark:text-white">{item.user?.name}</p>
                                       <p className="text-xs text-gray-500">{item.user?.email}</p>
                                    </div>
                                 </div>
                                 <button 
                                  onClick={() => handleUnenroll(item.user?._id)}
                                  className="p-3 text-red-100 bg-red-600 rounded-xl hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </button>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {managementTab === 'coupons' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30">
                       <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
                         <Tag className="h-5 w-5" /> Create Discount Coupon
                       </h3>
                       <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input 
                            required
                            type="text"
                            placeholder="CODE (e.g. SUMMER50)"
                            value={couponForm.code}
                            onChange={(e) => setCouponForm({...couponForm, code: e.target.value})}
                            className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                          />
                          <select 
                            value={couponForm.discountType}
                            onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})}
                            className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ({managementCourse.currency || 'ETB'})</option>
                          </select>
                          <input 
                            required
                            type="number"
                            placeholder="Amount"
                            value={couponForm.discountAmount}
                            onChange={(e) => setCouponForm({...couponForm, discountAmount: e.target.value})}
                            className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                          />
                          <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input 
                              type="date"
                              required
                              value={couponForm.expiryDate}
                              onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})}
                              className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                            />
                            <input 
                              type="number"
                              required
                              placeholder="Usage Limit"
                              value={couponForm.usageLimit}
                              onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})}
                              className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                            />
                            <button 
                              type="submit"
                              disabled={loadingAction}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-500/20 py-4"
                            >
                              Generate Coupon
                            </button>
                          </div>
                       </form>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Coupons</h3>
                       {couponsList.length === 0 ? (
                         <div className="text-center py-10 bg-gray-50 dark:bg-zinc-950 border-2 border-dashed rounded-3xl border-gray-200 dark:border-zinc-800">
                             <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                             <p className="text-gray-400 font-bold">No coupons created yet.</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {couponsList.map(c => (
                              <div key={c._id} className="p-6 bg-white dark:bg-zinc-950 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl flex items-center justify-between">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-2xl font-black text-emerald-600">{c.code}</span>
                                      <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-1 rounded font-black uppercase">ACTIVE</span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-bold font-mono">
                                      {c.discountAmount}{c.discountType === 'percentage' ? '%' : ' '+ (managementCourse.currency || 'ETB')} OFF • Exp: {new Date(c.expiryDate).toLocaleDateString()}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{c.usedCount} / {c.usageLimit}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Redemptions</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {managementTab === 'assignments' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border-2 border-amber-100 dark:border-amber-900/30">
                       <h3 className="text-xl font-black text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2">
                         <Plus className="h-5 w-5" /> Establish New Assignment
                       </h3>
                       <form onSubmit={handleCreateAssignment} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input 
                              required
                              type="text"
                              placeholder="Assignment Title"
                              value={assignmentForm.title}
                              onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                              className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                             />
                             <div className="grid grid-cols-2 gap-4">
                                <input 
                                  required
                                  type="number"
                                  placeholder="Module #"
                                  value={assignmentForm.module}
                                  onChange={(e) => setAssignmentForm({...assignmentForm, module: e.target.value})}
                                  className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                                />
                                <input 
                                  required
                                  type="number"
                                  placeholder="Max Points"
                                  value={assignmentForm.points}
                                  onChange={(e) => setAssignmentForm({...assignmentForm, points: e.target.value})}
                                  className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                                />
                             </div>
                          </div>
                          
                          <textarea 
                            required
                            placeholder="Detailed instructions for students..."
                            value={assignmentForm.description}
                            onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                            className="w-full p-4 h-32 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white resize-none"
                          />

                          {/* Question Builder */}
                          <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="font-black text-amber-800 dark:text-amber-300 text-sm uppercase tracking-widest">Questions ({assignmentForm.questions.length})</p>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => addQuestion('essay')} className="px-3 py-2 text-xs font-black bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">+ Essay</button>
                                <button type="button" onClick={() => addQuestion('short_answer')} className="px-3 py-2 text-xs font-black bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">+ Short Answer</button>
                                <button type="button" onClick={() => addQuestion('choice')} className="px-3 py-2 text-xs font-black bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">+ Multiple Choice</button>
                              </div>
                            </div>
                            {assignmentForm.questions.map((q, qi) => (
                              <div key={qi} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-500 uppercase">Q{qi + 1} ({q.type.replace('_', ' ')})</span>
                                  <button type="button" onClick={() => setAssignmentForm(prev => { const qs=[...prev.questions]; qs.splice(qi, 1); return {...prev, questions:qs}; })} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                <input type="text" required placeholder="Question prompt..." value={q.prompt} onChange={(e) => setAssignmentForm(prev => { const qs=[...prev.questions]; qs[qi].prompt = e.target.value; return {...prev, questions:qs}; })} className="w-full p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 outline-none font-bold text-sm" />
                                {q.type === 'choice' && (
                                  <div className="space-y-2 pl-4 border-l-2 border-gray-200 dark:border-zinc-800">
                                    {q.options.map((opt, oi) => (
                                      <div key={oi} className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                        <input type="text" required placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => setAssignmentForm(prev => { const qs=[...prev.questions]; qs[qi].options[oi] = e.target.value; return {...prev, questions:qs}; })} className="flex-1 p-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none" />
                                        {q.options.length > 1 && (
                                          <button type="button" onClick={() => setAssignmentForm(prev => { const qs=[...prev.questions]; qs[qi].options.splice(oi, 1); return {...prev, questions:qs}; })} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                                        )}
                                      </div>
                                    ))}
                                    <button type="button" onClick={() => setAssignmentForm(prev => { const qs=[...prev.questions]; qs[qi]={...qs[qi], options:[...qs[qi].options,'']}; return {...prev, questions:qs}; })} className="text-xs font-black text-green-600 hover:underline">+ Add option</button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {assignmentForm.questions.length === 0 && (
                              <p className="text-center text-sm text-amber-600 font-bold py-2">No questions added yet. Use the buttons above to add questions.</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input 
                              type="date"
                              value={assignmentForm.dueDate}
                              onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                              className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white"
                             />
                             <div className="flex gap-2">
                               {editingAssignment && (
                                 <button type="button" onClick={() => { setEditingAssignment(null); setAssignmentForm({ title: '', description: '', module: 1, points: 100, dueDate: '', questions: [] }); }} className="flex-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white rounded-xl font-black py-4">Cancel</button>
                               )}
                               <button 
                                type="submit"
                                disabled={loadingAction}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black shadow-lg shadow-amber-500/20 py-4"
                               >
                                 {loadingAction ? 'Saving...' : (editingAssignment ? 'Update & Resend' : 'Register Assignment')}
                               </button>
                             </div>
                          </div>
                       </form>
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Assignments</h3>
                       {assignmentsList.length === 0 ? (
                         <div className="text-center py-10 bg-gray-50 dark:bg-zinc-950 border-2 border-dashed rounded-3xl border-gray-300 dark:border-zinc-800">
                            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 font-bold">No assignments scheduled yet.</p>
                         </div>
                       ) : (
                         <div className="space-y-4">
                            {assignmentsList.map(asn => (
                               <div key={asn._id} className="group bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-amber-500 transition-all">
                                  <div className="flex items-center justify-between mb-4">
                                     <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                           <Award className="h-6 w-6 text-amber-600" />
                                        </div>
                                        <div>
                                           <h4 className="font-black text-xl text-gray-900 dark:text-white">{asn.title}</h4>
                                           <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Module {asn.module} • {asn.points} Potential Points</p>
                                        </div>
                                     </div>
                                     <button 
                                      onClick={() => fetchSubmissionsForGrading(asn)}
                                      className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-black hover:bg-indigo-600 hover:text-white transition-all"
                                     >
                                        Open Grading Desk
                                     </button>
                                  </div>
                                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50 dark:border-zinc-900 mt-4">
                                     <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-500">Due: {new Date(asn.dueDate).toLocaleDateString()}</span>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {showGradingDesk && gradingAssignment && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[110] animate-in zoom-in-95 duration-200">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800">
              <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
                 <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                       <Award className="h-8 w-8 text-amber-500" />
                       Grading Desk: {gradingAssignment.title}
                    </h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Reviewing submissions for Module {gradingAssignment.module}</p>
                 </div>
                 <button 
                  onClick={() => setShowGradingDesk(false)}
                  className="p-3 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                 >
                    <X className="h-6 w-6 text-gray-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 dark:bg-zinc-900/50">
                 {submissionsForGrading.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <Search className="h-20 w-20 text-gray-300 mb-4" />
                      <p className="text-2xl font-black text-gray-400">No submissions found for this assignment.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 gap-8">
                      {submissionsForGrading.map(sub => (
                        <div key={sub._id} className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                           <div className="flex flex-col lg:flex-row">
                              {/* Left: Submission Info */}
                              <div className="lg:w-2/5 p-8 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800">
                                 <div className="flex items-center gap-4 mb-6">
                                    <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-indigo-500 p-0.5">
                                       <img src={sub.student?.image || 'https://via.placeholder.com/150'} alt="" className="h-full w-full rounded-full object-cover" />
                                    </div>
                                    <div>
                                       <p className="text-xl font-black text-gray-900 dark:text-white">{sub.student?.name}</p>
                                       <p className="text-xs text-gray-500 font-bold">{sub.student?.email}</p>
                                    </div>
                                 </div>

                                 <div className="space-y-4">
                                    
                                    {sub.answers && sub.answers.length > 0 && (
                                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3">Student Answers</p>
                                        <div className="space-y-4">
                                          {sub.answers.map((ans, idx) => {
                                            const question = gradingAssignment.questions?.find(q => q._id === ans.questionId) || gradingAssignment.questions?.[ans.questionId];
                                            return (
                                              <div key={idx} className="border-l-2 border-amber-300 dark:border-amber-700 pl-3">
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Q: {question?.prompt || 'Unknown Question'}</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white bg-white dark:bg-zinc-900 p-2 rounded border border-gray-100 dark:border-zinc-800">{ans.answer}</p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl">
                                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student Notes</p>
                                       <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">
                                          {sub.studentNotes || "No notes provided."}
                                       </p>
                                    </div>
                                    <a 
                                      href={sub.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="w-full py-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all group"
                                    >
                                       <ExternalLink className="h-5 w-5" /> Review Student's Work
                                    </a>
                                    <div className="flex items-center justify-between px-2">
                                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Submitted On</p>
                                       <p className="text-sm font-black text-gray-600">{new Date(sub.createdAt).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                              </div>

                              {/* Right: Grading Form */}
                              <div className="flex-1 p-8 bg-zinc-50/20 dark:bg-zinc-950/20">
                                 <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                       <ClipboardList className="h-5 w-5 text-indigo-600" /> Administrative Grading
                                    </h4>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'graded' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                       {sub.status}
                                    </div>
                                 </div>

                                 <form onSubmit={(e) => handleGradeSubmission(e, sub._id)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div>
                                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Assign Score (Max {gradingAssignment.points})</label>
                                          <input 
                                           required
                                           type="number"
                                           max={gradingAssignment.points}
                                           defaultValue={sub.score || 0}
                                           onChange={(e) => setGradeForm({...gradeForm, score: e.target.value})}
                                           className="w-full p-4 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 font-black text-2xl text-indigo-700"
                                          />
                                       </div>
                                       <div>
                                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Grading Date</label>
                                          <div className="w-full p-4 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center gap-2 text-gray-500 font-bold">
                                             <Calendar className="h-5 w-5" />
                                             {sub.gradedAt ? new Date(sub.gradedAt).toLocaleDateString() : 'Unreviewed'}
                                          </div>
                                       </div>
                                    </div>
                                    <div>
                                       <label className="block text-xs font-black text-gray-400 uppercase mb-2">Constructive Feedback</label>
                                       <textarea 
                                        required
                                        placeholder="Explain the grade or suggest improvements..."
                                        defaultValue={sub.feedback || ""}
                                        onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})}
                                        className="w-full p-4 h-24 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700 dark:text-gray-300 resize-none"
                                       />
                                    </div>
                                    <button 
                                     disabled={loadingAction}
                                     type="submit"
                                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                       {loadingAction ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                       Commit Grade
                                    </button>
                                 </form>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorCoursesPage;
