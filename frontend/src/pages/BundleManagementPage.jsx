import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import BASE_URL from '../api/config';
import { Package, Plus, Edit, Trash2, AlertCircle, CheckCircle, Loader2, ArrowLeft, Settings, Users, ClipboardList, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const BundleManagementPage = () => {
  const { user } = useAuth();
  const { formatPrice, etbUsdRate, etbEurRate } = useCurrency();
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Bundle advanced features states
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [selectedBundleForAction, setSelectedBundleForAction] = useState(null);
  
  const [modTitle, setModTitle] = useState('');
  const [modVideo, setModVideo] = useState('');
  const [modThumbnail, setModThumbnail] = useState('');
  const [modContent, setModContent] = useState('');
  const [modIsReleased, setModIsReleased] = useState(true);
  const [modDripDelay, setModDripDelay] = useState(0);

  const [showCohortForm, setShowCohortForm] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortStartDate, setCohortStartDate] = useState('');
  const [cohortEndDate, setCohortEndDate] = useState('');
  const [myCohorts, setMyCohorts] = useState([]);

  const [showManagementView, setShowManagementView] = useState(false);
  const [managementBundle, setManagementBundle] = useState(null);
  const [managementTab, setManagementTab] = useState('students');
  const [studentsList, setStudentsList] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '' });
  const [couponForm, setCouponForm] = useState({
    code: '', discountType: 'percentage', discountAmount: '', expiryDate: '', usageLimit: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: '', description: '', points: 100, dueDate: '',
    questions: []
  });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewSubmissionsForAsn, setViewSubmissionsForAsn] = useState(null);
  const [asnSubmissions, setAsnSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courses: [],
    price: '',
    image: ''
  });

  // Fetch instructor's bundles and courses
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      // Fetch instructor's courses
      const { data: coursesData } = await axios.get(
        `${BASE_URL}/courses/instructor/mycourses`,
        config
      );
      setMyCourses(coursesData); // Show all courses

      // Fetch instructor's bundles
      const { data: myBundles } = await axios.get(`${BASE_URL}/bundles/instructor/mybundles`, config);
      setBundles(myBundles);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCourseToggle = (courseId) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.includes(courseId)
        ? prev.courses.filter(id => id !== courseId)
        : [...prev.courses, courseId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Please enter bundle title' });
      return;
    }
    if (formData.courses.length < 2) {
      setMessage({ type: 'error', text: 'Please select at least 2 courses' });
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid price' });
      return;
    }
    const totalPrice = calculateTotalPrice();
    if (parseFloat(formData.price) >= totalPrice) {
      setMessage({ type: 'error', text: 'Bundle price must be less than the total sum of the individual courses' });
      return;
    }

    try {
      const config = {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      };

      const bundleData = {
        title: formData.title,
        description: formData.description,
        courses: formData.courses,
        price: parseFloat(formData.price),
        image: formData.image
      };

      if (editingBundle) {
        // Update existing bundle (if backend supports it)
        await axios.put(
          `${BASE_URL}/bundles/${editingBundle._id}`,
          bundleData,
          config
        );
        setMessage({ type: 'success', text: 'Bundle updated successfully!' });
      } else {
        // Create new bundle
        await axios.post(`${BASE_URL}/bundles`, bundleData, config);
        setMessage({ type: 'success', text: 'Bundle created successfully!' });
      }

      // Reset form and refresh data
      setFormData({
        title: '',
        description: '',
        courses: [],
        price: '',
        image: ''
      });
      setShowCreateForm(false);
      setEditingBundle(null);
      fetchData();
    } catch (error) {
      console.error('Error saving bundle:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save bundle' 
      });
    }
  };

  const uploadFileHandler = async (e, setField) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    setLoadingAction(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(`${BASE_URL}/upload`, formData, config);
      setField(data.fileUrl);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Failed to upload file: ${errorMsg}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleManualEnroll = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setLoadingAction(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/enrollments/manual`, { 
        email: searchEmail, 
        bundleId: managementBundle._id 
      }, cfg);
      setSearchEmail('');
      alert('Student enrolled successfully');
      fetchManagementData();
      // setShowGradingDesk(false);
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
      await axios.delete(`${BASE_URL}/enrollments/manual/bundle/${managementBundle._id}/${userId}`, cfg);
      fetchManagementData();
    } catch (err) {
      alert('Failed to unenroll');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        ...couponForm,
        bundleId: managementBundle._id
      };
      await axios.post(`${BASE_URL}/lms/coupons`, payload, config);
      alert('Coupon created successfully!');
      setCouponForm({ code: '', discountType: 'percentage', discountAmount: '', expiryDate: '', usageLimit: '' });
      fetchManagementData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setLoadingAction(false);
    }
  };

  const fetchManagementData = async () => {
    if (!managementBundle || !user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [studentsRes, cohortsRes, asgnRes, couponsRes] = await Promise.all([
        axios.get(`${BASE_URL}/enrollments/bundle/${managementBundle._id}/students`, config).catch(() => ({data: []})),
        axios.get(`${BASE_URL}/cohorts/bundle/${managementBundle._id}`, config).catch(() => ({data: []})),
        axios.get(`${BASE_URL}/lms/bundles/${managementBundle._id}/assignments`, config).catch(() => ({data: []})),
        axios.get(`${BASE_URL}/lms/coupons/bundle/${managementBundle._id}`, config).catch(() => ({data: []}))
      ]);
      
      setStudentsList(studentsRes.data);
      setMyCohorts(cohortsRes.data);
      setAssignmentsList(asgnRes.data);
      setCouponsList(couponsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (showManagementView && managementBundle) {
      fetchManagementData();
    }
  }, [showManagementView, managementBundle, managementTab]);

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/bundles/${selectedBundleForAction._id}/modules`, {
        title: modTitle, videoUrl: modVideo || '', thumbnail: modThumbnail || '',
        content: modContent, dripDelayDays: modDripDelay, isReleased: modIsReleased
      }, config);
      alert('Module added successfully!');
      setModTitle(''); setModVideo(''); setModThumbnail(''); setModContent(''); setModIsReleased(true); setModDripDelay(0);
      fetchData();
      setShowModuleForm(false);
      setSelectedBundleForAction(null);
    } catch (error) {
      alert('Failed to add module');
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!selectedBundleForAction) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/cohorts`, {
        name: cohortName,
        bundleId: selectedBundleForAction._id,
        startDate: cohortStartDate,
        endDate: cohortEndDate
      }, config);
      
      setMyCohorts([...myCohorts, data]);
      setCohortName(''); setCohortStartDate(''); setCohortEndDate('');
      setShowCohortForm(false);
      setSelectedBundleForAction(null);
      alert('Cohort created successfully!');
    } catch (error) {
      alert('Failed to create cohort');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    const isEditing = !!editingAssignment; // capture before any state reset
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      if (isEditing) {
        await axios.put(`${BASE_URL}/lms/assignments/${editingAssignment._id}`, { 
          ...assignmentForm, bundleId: managementBundle._id 
        }, cfg);
        setEditingAssignment(null);
      } else {
        const { data: newAssignment } = await axios.post(`${BASE_URL}/lms/assignments`, { 
          ...assignmentForm, bundleId: managementBundle._id 
        }, cfg);
        // Optimistically add the new assignment to the list immediately so it shows in history
        setAssignmentsList(prev => [newAssignment, ...prev]);
      }
      setAssignmentForm({ title: '', description: '', points: 100, dueDate: '', questions: [] });
      setMessage({ type: 'success', text: isEditing ? 'Assignment updated & sent for re-approval!' : 'Assignment created & sent for approval!' });
      // Refetch to sync with server (awaited to prevent race with loadingAction)
      await fetchManagementData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save assignment' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteAssignment = async (asnId) => {
    if (!window.confirm('Delete this assignment? This cannot be undone.')) return;
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${BASE_URL}/lms/assignments/${asnId}`, cfg);
      setAssignmentsList(prev => prev.filter(a => a._id !== asnId));
    } catch { setMessage({ type: 'error', text: 'Failed to delete assignment' }); }
  };

  const handleResendAssignment = async (asnId) => {
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/lms/assignments/${asnId}/resend`, {}, cfg);
      setMessage({ type: 'success', text: 'Assignment resent for admin approval!' });
      fetchManagementData();
    } catch { setMessage({ type: 'error', text: 'Failed to resend' }); }
  };

  const handleEditAssignment = (asn) => {
    setEditingAssignment(asn);
    setAssignmentForm({ 
      title: asn.title, description: asn.description, 
      points: asn.points, dueDate: asn.dueDate?.split('T')[0] || '',
      questions: asn.questions || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewSubmissions = async (asn) => {
    setViewSubmissionsForAsn(asn);
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${BASE_URL}/lms/assignments/${asn._id}/submissions`, cfg);
      setAsnSubmissions(Array.isArray(data) ? data : []);
    } catch { setAsnSubmissions([]); }
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission) return;
    try {
      const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/lms/submissions/${gradingSubmission._id}/grade`, gradeData, cfg);
      setGradingSubmission(null);
      setGradeData({ score: '', feedback: '' });
      handleViewSubmissions(viewSubmissionsForAsn);
      setMessage({ type: 'success', text: 'Submission graded and student notified!' });
    } catch { setMessage({ type: 'error', text: 'Failed to grade submission' }); }
  };

  const addQuestion = (type) => {
    setAssignmentForm(prev => ({
      ...prev,
      questions: [...prev.questions, { type, prompt: '', options: type === 'choice' ? ['', ''] : [], correctOption: 0 }]
    }));
  };

  const updateQuestion = (idx, field, value) => {
    setAssignmentForm(prev => {
      const qs = [...prev.questions];
      qs[idx] = { ...qs[idx], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  const removeQuestion = (idx) => {
    setAssignmentForm(prev => ({
      ...prev, questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const updateChoiceOption = (qIdx, optIdx, value) => {
    setAssignmentForm(prev => {
      const qs = [...prev.questions];
      const opts = [...(qs[qIdx].options || [])];
      opts[optIdx] = value;
      qs[qIdx] = { ...qs[qIdx], options: opts };
      return { ...prev, questions: qs };
    });
  };

  const handleEdit = (bundle) => {
    setEditingBundle(bundle);
    setFormData({
      title: bundle.title,
      description: bundle.description,
      courses: bundle.courses.map(c => c._id || c),
      price: (bundle.price || 0).toString(),
      image: bundle.image || ''
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) {
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.delete(`${BASE_URL}/bundles/${bundleId}`, config);
      setMessage({ type: 'success', text: 'Bundle deleted successfully!' });
      fetchData();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete bundle' 
      });
    }
  };

  const calculateTotalPrice = () => {
    return formData.courses.reduce((total, courseId) => {
      const course = myCourses.find(c => c._id === courseId);
      if (!course) return total;
      
      let priceInETB = Number(course.price) || 0;
      const curr = (course.currency || 'ETB').toUpperCase();
      if (curr === 'USD') priceInETB = priceInETB * (etbUsdRate || 150);
      else if (curr === 'EUR') priceInETB = priceInETB * (etbEurRate || 165);
      
      return total + priceInETB;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col mb-8">
          <div className="mb-4">
            <button 
              onClick={() => navigate('/instructor/courses')}
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors w-fit px-3 py-2 -ml-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to your dashboard
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Package className="h-8 w-8 text-indigo-600" />
                My Course Bundles
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create and manage course bundles for your students
              </p>
            </div>
            
            {!showCreateForm && (
            <button
              onClick={() => {
                setEditingBundle(null);
                setFormData({
                  title: '',
                  description: '',
                  courses: [],
                  price: '',
                  image: ''
                });
                setShowCreateForm(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="h-5 w-5" />
              Create Bundle
            </button>
          )}
        </div>
      </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Create/Edit Bundle Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingBundle(null);
                  setMessage({ type: '', text: '' });
                }}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bundle Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Web Development Starter Pack"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what's included in this bundle..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Courses * (minimum 2)
                </label>
                {myCourses.length === 0 ? (
                  <p className="text-red-600 dark:text-red-400">
                    You need at least 2 published courses to create a bundle.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {myCourses.map(course => (
                      <label
                        key={course._id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.courses.includes(course._id)}
                          onChange={() => handleCourseToggle(course._id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">{course.title}</h4>
                            <p className="text-sm text-gray-500">
                              Price: {formatPrice(course.price, false, course.currency || 'ETB').formatted}
                            </p>
                          </div>
                      </label>
                    ))}
                  </div>
                )}
                {formData.courses.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Selected {formData.courses.length} course(s) | 
                    Individual total: {calculateTotalPrice()} ETB
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bundle Price (ETB) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 1500"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                {formData.courses.length >= 2 && formData.price && (
                  <p className="mt-2 text-sm">
                    {parseFloat(formData.price) < calculateTotalPrice() ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Savings: {formatPrice(calculateTotalPrice() - parseFloat(formData.price), false, 'ETB').formatted} 
                        ({(((calculateTotalPrice() - parseFloat(formData.price)) / calculateTotalPrice()) * 100).toFixed(0)}% discount)
                      </span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400">
                        ⚠️ Bundle price is higher than individual total
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bundle Image *
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Image URL (Google Drive / Web)"
                      value={formData.image || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      id="bundle-image-upload"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label 
                      htmlFor="bundle-image-upload"
                      className="flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-4 rounded-lg cursor-pointer transition-colors whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300"
                    >
                      Browse
                    </label>
                  </div>
                  {formData.image && (
                    <div className="mt-2">
                      <img 
                        src={formData.image} 
                        alt="Bundle preview" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formData.courses.length < 2}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {editingBundle ? 'Update Bundle' : 'Create Bundle'}
              </button>
            </form>
          </div>
        )}

        {/* Bundles List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            My Bundles ({bundles.length})
          </h2>

          {bundles.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                You haven't created any bundles yet
              </p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">
                Create course bundles to offer discounted packages to your students
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map(bundle => (
                <div
                  key={bundle._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  {/* Bundle Image */}
                  <img
                    src={bundle.image || 'https://via.placeholder.com/400x300?text=Bundle'}
                    alt={bundle.title}
                    className="w-full h-48 object-cover"
                  />

                  {/* Bundle Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {bundle.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {bundle.description}
                    </p>

                    {/* Courses Included */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Includes {bundle.courses.length} courses:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {bundle.courses.slice(0, 3).map((course, idx) => (
                          <li key={idx} className="truncate">
                            • {course.title || 'Course'}
                          </li>
                        ))}
                        {bundle.courses.length > 3 && (
                          <li className="text-indigo-600">
                            + {bundle.courses.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Price and Status */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-indigo-600">
                        {formatPrice(bundle.price, false, 'ETB').formatted}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bundle.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
                            : bundle.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          {bundle.status ? bundle.status.charAt(0).toUpperCase() + bundle.status.slice(1) : 'Pending'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bundle.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {bundle.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Advanced Action Buttons */}
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => { setSelectedBundleForAction(bundle); setShowModuleForm(true); }}
                          className="w-full py-2.5 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-bold"
                        >
                          + Module
                        </button>
                        <button 
                           onClick={() => { setManagementBundle(bundle); setShowManagementView(true); setManagementTab('students'); }}
                           className="w-full py-2.5 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition font-bold flex items-center justify-center gap-2"
                         >
                           <Settings className="h-4 w-4" /> Manage
                         </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <button 
                           onClick={() => { setSelectedBundleForAction(bundle); setShowCohortForm(true); }}
                           className="w-full py-2 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition font-semibold text-center"
                         >
                           + Cohort
                         </button>
                         <Link 
                          to={`/instructor/quiz-builder?bundleId=${bundle._id}`}
                          className="w-full py-2 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition font-semibold flex items-center justify-center text-center"
                        >
                          Quiz Builder
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link 
                          to={`/peer-review?bundleId=${bundle._id}`}
                          className="w-full py-2 text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition font-semibold flex items-center justify-center text-center"
                        >
                          Peer Reviews
                        </Link>
                         <button 
                          onClick={() => handleEdit(bundle)}
                          className="w-full py-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 mt-2">
                        <button
                          onClick={() => handleDelete(bundle._id)}
                          className="w-full py-2 flex items-center justify-center gap-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Bundle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModuleForm && selectedBundleForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Module: {selectedBundleForAction.title}</h2>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Notice:</strong> New modules require Admin approval before they become visible to students.
              </p>
            </div>
            
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Module/Part Title</label>
                <input 
                  required 
                  value={modTitle} 
                  onChange={e=>setModTitle(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. Week 1: Introduction" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Video URL (Google Drive / YouTube / Upload)</label>
                <div className="flex gap-2">
                  <input 
                    value={modVideo} 
                    onChange={e=>setModVideo(e.target.value)} 
                    className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="video/*"
                    id="mod-video-file"
                    onChange={(e) => uploadFileHandler(e, setModVideo)}
                    className="hidden"
                  />
                  <label 
                    htmlFor="mod-video-file"
                    className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Browse
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Document URL (Google Link / Upload)</label>
                <div className="flex gap-2">
                  <input 
                    value={modContent} 
                    onChange={e=>setModContent(e.target.value)} 
                    className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                    placeholder="https://docs.google.com/..."
                  />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    id="mod-doc-file"
                    onChange={(e) => uploadFileHandler(e, setModContent)}
                    className="hidden"
                  />
                  <label 
                    htmlFor="mod-doc-file"
                    className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Browse
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 mt-4 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => { setShowModuleForm(false); setSelectedBundleForAction(null); }} 
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

      {showCohortForm && selectedBundleForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Establish Cohort: {selectedBundleForAction.title}</h2>
            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Cohort Identifier</label>
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
                  type="date" required value={cohortStartDate} onChange={e=>setCohortStartDate(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                <input 
                  type="date" required value={cohortEndDate} onChange={e=>setCohortEndDate(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowCohortForm(false); setSelectedBundleForAction(null); }} 
                  className="flex-1 py-3 bg-gray-300 text-gray-800 rounded-xl font-bold hover:bg-gray-400"
                >Cancel</button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                >Launch Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManagementView && managementBundle && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-950/50">
               <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <Settings className="h-8 w-8 text-indigo-600" /> Manage: {managementBundle.title}
                  </h2>
               </div>
               <button onClick={() => setShowManagementView(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                 <Trash2 className="h-6 w-6 text-gray-400 hidden" />
                 Close
               </button>
            </div>

            <div className="flex px-8 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
               <button onClick={() => setManagementTab('cohorts')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'cohorts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <Users className="h-5 w-5" /> Cohort Strategy
               </button>
               <button onClick={() => setManagementTab('students')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <Users className="h-5 w-5" /> Student Roster
               </button>
               <button onClick={() => setManagementTab('coupons')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <BookOpen className="h-5 w-5" /> Course Pricing
               </button>
               <button onClick={() => setManagementTab('assignments')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <ClipboardList className="h-5 w-5" /> Assignments
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               {managementTab === 'cohorts' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30">
                       <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
                         <Users className="h-5 w-5" /> Manage Batches / Cohorts
                       </h3>
                       {myCohorts.length === 0 ? (
                         <div className="text-center py-10"><p className="text-gray-500 font-bold">No cohorts created yet.</p></div>
                       ) : (
                         <div className="space-y-6">
                            {myCohorts.map(cohort => (
                              <div key={cohort._id} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
                                  <div>
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white">{cohort.name}</h4>
                                    <p className="text-sm text-gray-500 font-medium">{new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}</p>
                                  </div>
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
                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Students ({studentsList.length})</h3>
                       
                       <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30 mb-8">
                          <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5" /> Free Manual Enrollment
                          </h3>
                          <form onSubmit={handleManualEnroll} className="flex flex-col md:flex-row gap-4">
                             <input 
                                required 
                                type="email" 
                                placeholder="Student Email Address" 
                                value={searchEmail} 
                                onChange={(e) => setSearchEmail(e.target.value)} 
                                className="flex-1 p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white focus:border-indigo-500" 
                             />
                             <button type="submit" disabled={loadingAction} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20 px-8 py-4 whitespace-nowrap">
                                Enroll for Free
                             </button>
                          </form>
                       </div>

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
                         <Plus className="h-5 w-5" /> Create Discount Coupon
                       </h3>
                       <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input required type="text" placeholder="CODE (e.g. SUMMER50)" value={couponForm.code} onChange={(e) => setCouponForm({...couponForm, code: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                          <select value={couponForm.discountType} onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white">
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (ETB)</option>
                          </select>
                          <input required type="number" placeholder="Amount" value={couponForm.discountAmount} onChange={(e) => setCouponForm({...couponForm, discountAmount: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                          <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="date" required value={couponForm.expiryDate} onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                            <input type="number" required placeholder="Usage Limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                            <button type="submit" disabled={loadingAction} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-500/20 py-4">Generate Coupon</button>
                          </div>
                       </form>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Coupons</h3>
                       {couponsList.length === 0 ? (
                         <div className="text-center py-10 bg-gray-50 dark:bg-zinc-950 border-2 border-dashed rounded-3xl border-gray-200 dark:border-zinc-800">
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
                                      {c.discountAmount}{c.discountType === 'percentage' ? '%' : ' ETB'} OFF • Exp: {new Date(c.expiryDate).toLocaleDateString()}
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

                   {/* ── Create / Edit Form ── */}
                   <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border-2 border-amber-100 dark:border-amber-900/30">
                      <h3 className="text-xl font-black text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5" /> {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                      </h3>
                      <form onSubmit={handleCreateAssignment} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input required type="text" placeholder="Assignment Title" value={assignmentForm.title} onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                            <input required type="number" placeholder="Max Points" value={assignmentForm.points} onChange={(e) => setAssignmentForm({...assignmentForm, points: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                         </div>
                         <textarea required placeholder="Detailed instructions for students..." value={assignmentForm.description} onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})} className="w-full p-4 h-28 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white resize-none" />
                         <input type="date" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />

                         {/* ── Question Builder ── */}
                         <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-4 space-y-4">
                           <div className="flex items-center justify-between">
                             <p className="font-black text-amber-800 dark:text-amber-300 text-sm uppercase tracking-widest">📝 Questions ({assignmentForm.questions.length})</p>
                             <div className="flex gap-2">
                               <button type="button" onClick={() => addQuestion('essay')} className="px-3 py-2 text-xs font-black bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">+ Essay</button>
                               <button type="button" onClick={() => addQuestion('choice')} className="px-3 py-2 text-xs font-black bg-green-100 text-green-700 rounded-lg hover:bg-green-200">+ Choice</button>
                               <button type="button" onClick={() => addQuestion('short_answer')} className="px-3 py-2 text-xs font-black bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">+ Short Answer</button>
                             </div>
                           </div>
                           {assignmentForm.questions.map((q, qi) => (
                             <div key={qi} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                               <div className="flex items-center justify-between">
                                 <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${q.type === 'essay' ? 'bg-blue-100 text-blue-700' : q.type === 'choice' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{q.type.replace('_',' ')}</span>
                                 <button type="button" onClick={() => removeQuestion(qi)} className="text-red-500 hover:text-red-700 font-black text-xs">✕ Remove</button>
                               </div>
                               <input required placeholder={`Question ${qi + 1} prompt...`} value={q.prompt} onChange={e => updateQuestion(qi, 'prompt', e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 font-medium text-gray-900 dark:text-white outline-none" />
                               {q.type === 'choice' && (
                                 <div className="space-y-2">
                                   {(q.options || []).map((opt, oi) => (
                                     <div key={oi} className="flex items-center gap-2">
                                       <input type="radio" name={`correct-${qi}`} checked={q.correctOption === oi} onChange={() => updateQuestion(qi, 'correctOption', oi)} className="accent-green-500" title="Mark as correct" />
                                       <input placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateChoiceOption(qi, oi, e.target.value)} className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 font-medium text-gray-900 dark:text-white outline-none text-sm" />
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

                         <div className="flex gap-3">
                           {editingAssignment && (
                             <button type="button" onClick={() => { setEditingAssignment(null); setAssignmentForm({ title: '', description: '', points: 100, dueDate: '', questions: [] }); }} className="flex-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white rounded-xl font-black py-4">Cancel Edit</button>
                           )}
                           <button type="submit" disabled={loadingAction} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black shadow-lg shadow-amber-500/20 py-4">
                             {loadingAction ? '⏳ Saving...' : (editingAssignment ? '✏️ Update & Resend for Approval' : '🚀 Submit for Approval')}
                           </button>
                         </div>
                      </form>
                   </div>
                   
                   {/* ── Assignment List ── */}
                   <div className="space-y-4">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">Bundle Assignments</h3>
                      {assignmentsList.length === 0 ? (
                        <div className="text-center py-10"><p className="text-gray-400 font-bold">No assignments yet. Create one above.</p></div>
                      ) : (
                        <div className="space-y-4">
                           {assignmentsList.map(asn => (
                              <div key={asn._id} className="group bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-amber-500 transition-all">
                                 <div className="flex items-start justify-between mb-3">
                                    <div>
                                       <h4 className="font-black text-xl text-gray-900 dark:text-white">{asn.title}</h4>
                                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{asn.points} pts{asn.dueDate ? ` • Due ${new Date(asn.dueDate).toLocaleDateString()}` : ''}</p>
                                       <span className={`mt-2 inline-block text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${asn.status === 'approved' ? 'bg-green-100 text-green-700' : asn.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                         {asn.status === 'approved' ? '✅ Approved' : asn.status === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                                       </span>
                                       {asn.questions?.length > 0 && <p className="text-xs text-gray-400 mt-1">{asn.questions.length} question(s)</p>}
                                    </div>
                                    <div className="flex gap-2 flex-wrap justify-end">
                                       <button onClick={() => handleViewSubmissions(asn)} className="px-3 py-2 text-xs font-black bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200">📋 Submissions</button>
                                       <button onClick={() => handleEditAssignment(asn)} className="px-3 py-2 text-xs font-black bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200">✏️ Edit</button>
                                       {asn.status !== 'approved' && (
                                         <button onClick={() => handleResendAssignment(asn._id)} className="px-3 py-2 text-xs font-black bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200">🔄 Resend</button>
                                       )}
                                       <button onClick={() => handleDeleteAssignment(asn._id)} className="px-3 py-2 text-xs font-black bg-red-100 text-red-600 rounded-xl hover:bg-red-200">🗑️ Delete</button>
                                    </div>
                                 </div>
                                 <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{asn.description}</p>
                              </div>
                           ))}
                        </div>
                      )}
                   </div>

                   {/* ── Submissions Panel ── */}
                   {viewSubmissionsForAsn && (
                     <div className="bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-200 dark:border-indigo-900/30 rounded-3xl p-6 space-y-4">
                       <div className="flex items-center justify-between">
                         <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-300">📋 Submissions — {viewSubmissionsForAsn.title}</h3>
                         <button onClick={() => { setViewSubmissionsForAsn(null); setAsnSubmissions([]); }} className="text-gray-500 hover:text-gray-700 font-black">✕ Close</button>
                       </div>
                       {asnSubmissions.length === 0 ? (
                         <p className="text-gray-400 font-bold text-center py-6">No submissions yet.</p>
                       ) : (
                         <div className="space-y-4">
                           {asnSubmissions.map(sub => (
                             <div key={sub._id} className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-700 rounded-2xl p-5">
                               <div className="flex items-start justify-between mb-2">
                                 <div>
                                   <p className="font-black text-gray-900 dark:text-white">{sub.student?.name || 'Unknown'}</p>
                                   <p className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleString()}</p>
                                 </div>
                                 <div className="text-right">
                                   {sub.score !== undefined ? (
                                     <span className="font-black text-green-600 dark:text-green-400 text-lg">{sub.score}/{viewSubmissionsForAsn.points}</span>
                                   ) : (
                                     <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-black">Ungraded</span>
                                   )}
                                 </div>
                               </div>
                               {sub.textAnswer && <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-950 rounded-xl p-3 mb-3 whitespace-pre-wrap">{sub.textAnswer}</p>}
                               {sub.feedback && <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">Feedback: {sub.feedback}</p>}
                               <button onClick={() => { setGradingSubmission(sub); setGradeData({ score: sub.score || '', feedback: sub.feedback || '' }); }} className="mt-2 px-4 py-2 text-xs font-black bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                                 ✏️ {sub.score !== undefined ? 'Edit Grade' : 'Grade'}
                               </button>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   )}
                </div>
               )}

               {/* ── Grading Modal ── */}
               {gradingSubmission && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setGradingSubmission(null)}>
                   <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border dark:border-zinc-800 p-8 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
                     <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">✏️ Grade Submission</h2>
                     <p className="text-gray-500 text-sm mb-4">Student: <strong>{gradingSubmission.student?.name}</strong></p>
                     <div className="space-y-4">
                       <input type="number" min={0} max={viewSubmissionsForAsn?.points || 100} placeholder={`Score (max ${viewSubmissionsForAsn?.points || 100})`} value={gradeData.score} onChange={e => setGradeData({ ...gradeData, score: e.target.value })} className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white outline-none font-bold" />
                       <textarea placeholder="Feedback / Reply to student..." rows={4} value={gradeData.feedback} onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })} className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white resize-none outline-none font-medium" />
                     </div>
                     <div className="flex gap-3 mt-4">
                       <button onClick={() => setGradingSubmission(null)} className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl font-black">Cancel</button>
                       <button onClick={handleGradeSubmission} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700">Submit Grade & Notify Student</button>
                     </div>
                   </div>
                 </div>
               )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleManagementPage;
