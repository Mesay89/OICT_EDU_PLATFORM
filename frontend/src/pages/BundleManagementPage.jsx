import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axios from 'axios';
import BASE_URL from '../api/config';
import { Package, Plus, Edit, Trash2, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

const BundleManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

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
      setMyCourses(coursesData.filter(c => c.status === 'published')); // Only published courses

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

  const handleEdit = (bundle) => {
    setEditingBundle(bundle);
    setFormData({
      title: bundle.title,
      description: bundle.description,
      courses: bundle.courses.map(c => c._id || c),
      price: bundle.price.toString(),
      image: bundle.image || ''
    });
    setShowCreateForm(true);
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
      return total + (course?.price || 0);
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
                          <p className="font-medium text-gray-900 dark:text-white">
                            {course.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Price: {course.price} ETB
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
                      <span className="text-green-600 dark:text-green-400">
                        ✓ Savings: {(calculateTotalPrice() - parseFloat(formData.price)).toFixed(2)} ETB 
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

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bundle Image URL *
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
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
                        {bundle.price} ETB
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

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(bundle)}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 px-4 py-2 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bundle._id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-4 py-2 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BundleManagementPage;
