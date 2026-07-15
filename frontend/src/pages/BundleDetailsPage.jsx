import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';
import { useCurrency } from '../context/CurrencyContext';
import {
  BookOpen, Package, ArrowLeft, CheckCircle, PlaySquare,
  Users, Star, Tag, ShoppingCart, Loader2, X
} from 'lucide-react';

const paymentMethods = [
  { id: 'chapa', name: 'Ethiopian Banking (Telebirr, CBE Birr, Banks)', icon: '🇪🇹', color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' },
  { id: 'cbe', name: 'CBE Bank Transfer (Manual)', icon: '🏦', color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/10' },
  { id: 'telebirr', name: 'TeleBirr (Manual)', icon: '📱', color: 'bg-pink-50 border-pink-200 dark:bg-pink-900/10' },
  { id: 'balance', name: 'Pay with Earnings Balance', icon: '💰', color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' },
  { id: 'stripe', name: 'International Credit Card (Stripe)', icon: '💳', color: 'bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700' },
];

const BundleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { formatPrice } = useCurrency();

  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${BASE_URL}/bundles/${id}`);
        setBundle(data);

        // Check which courses the user is already enrolled in
        if (user?.token) {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const { data: enrollments } = await axios.get(`${BASE_URL}/enrollments/myenrollments`, config);
          const ids = enrollments.map(e => (e.course?._id || e.course)?.toString());
          setEnrolledCourseIds(ids);
        }
      } catch (err) {
        console.error('Error fetching bundle:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBundle();
  }, [id, user]);

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const restrictedRoles = ['instructor', 'cashManager', 'admin', 'superAdmin'];
    if (restrictedRoles.includes(user.role)) {
      alert(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)}s cannot purchase bundles.`);
      return;
    }
    navigate(`/bundle-checkout/${id}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-950">
      <Loader2 className="animate-spin h-16 w-16 text-violet-600" />
    </div>
  );

  if (!bundle) return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center p-8 bg-white dark:bg-zinc-950">
      <Package className="h-20 w-20 text-gray-300 mb-6" />
      <h1 className="text-[32px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-2">Bundle Not Found</h1>
      <Link to="/courses" className="mt-6 bg-violet-600 text-[#F9FAFB] px-8 py-3 rounded-xl font-bold text-[16px] leading-[1.5] hover:bg-violet-700 transition-colors">
        Back to Catalog
      </Link>
    </div>
  );

  const allAlreadyEnrolled = bundle.courses?.every(c => enrolledCourseIds.includes(c._id?.toString()));
  const totalOriginalPrice = bundle.courses?.reduce((sum, c) => sum + (c.price || 0), 0) || 0;
  const savings = totalOriginalPrice - bundle.price;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Hero */}
      <div className="relative bg-zinc-900 overflow-hidden min-h-[360px] flex items-center">
        <div className="absolute inset-0 z-0">
          {bundle.image ? (
            <img src={bundle.image} className="w-full h-full object-cover opacity-20 blur-xl scale-110" alt="" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-indigo-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-[16px] font-bold leading-[1.5] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Catalog
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-600/20 border border-violet-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-violet-400 mb-4">
            <Package className="h-3 w-3" /> Bundle Deal
          </div>
          <h1 className="text-[32px] md:text-[32px] font-bold leading-[1.5] text-[#F9FAFB] tracking-tight mb-4">
            {bundle.title}
          </h1>
          <p className="text-[20px] leading-[1.5] text-zinc-300 max-w-2xl font-bold mb-6">
            {bundle.description}
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center font-bold text-[#F9FAFB] text-[16px] leading-[1.5]">
                {bundle.instructor?.name?.charAt(0) || 'I'}
              </div>
              <div>
                <p className="text-[16px] leading-[1.5] text-zinc-500 font-bold">Created by</p>
                <p className="text-[#F9FAFB] font-bold text-[16px] leading-[1.5]">{bundle.instructor?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <BookOpen className="h-4 w-4" />
              <span className="text-[16px] font-bold leading-[1.5]">{bundle.courses?.length || 0} courses included</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Courses List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 p-8 shadow-sm">
            <h2 className="text-[24px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-6 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-violet-600" /> Courses in This Bundle
            </h2>
            <div className="space-y-4">
              {bundle.courses?.map((course, idx) => {
                const isEnrolled = enrolledCourseIds.includes(course._id?.toString());
                return (
                  <div
                    key={course._id}
                    className="flex items-center gap-5 p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-100 dark:border-zinc-800 hover:border-violet-500/40 transition-all group"
                  >
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center font-bold text-violet-600 text-[16px] leading-[1.5] flex-shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#111827] dark:text-[#F9FAFB] text-[16px] leading-[1.5] group-hover:text-violet-600 transition-colors truncate">
                        {course.title}
                      </p>
                      <p className="text-[16px] leading-[1.5] text-gray-400 font-bold mt-0.5">
                        {course.price === 0 ? 'Free' : `${formatPrice(course.price).formatted}`} individual
                      </p>
                    </div>
                    {isEnrolled ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-[16px] leading-[1.5] font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full flex-shrink-0">
                        <CheckCircle className="h-3 w-3" /> Enrolled
                      </span>
                    ) : (
                      <span className="text-[16px] leading-[1.5] text-gray-400 font-bold flex-shrink-0">
                        {formatPrice(course.price).formatted}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* What you get */}
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 p-8 shadow-sm">
            <h2 className="text-[24px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB] mb-6 flex items-center gap-3">
              <Star className="h-6 w-6 text-amber-500" /> What You Get
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: PlaySquare, text: 'Full access to all courses in the bundle', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
                { icon: CheckCircle, text: 'Certificate of completion for each course', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
                { icon: Users, text: 'Community access & peer discussions', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
                { icon: Tag, text: `Save ${savings > 0 ? formatPrice(savings).formatted : 'money'} vs buying individually`, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950/50 border border-gray-100 dark:border-zinc-800">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-[16px] font-bold leading-[1.5] text-gray-600 dark:text-gray-300 pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 p-8 shadow-xl">
            {bundle.image && (
              <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="text-center mb-6">
              <p className="text-[32px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">
                {formatPrice(bundle.price).formatted}
              </p>
              {savings > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[16px] leading-[1.5] text-gray-400 line-through font-bold">
                    {formatPrice(totalOriginalPrice).formatted} if bought separately
                  </p>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[16px] font-bold leading-[1.5]">
                    <Tag className="h-3 w-3" /> Save {formatPrice(savings).formatted}
                  </span>
                </div>
              )}
            </div>

            {allAlreadyEnrolled ? (
              <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-2xl font-black text-center flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle className="h-5 w-5" /> Already Enrolled in All Courses
              </div>
            ) : user && ['instructor', 'cashManager', 'admin', 'superAdmin'].includes(user.role) ? (
              <div className="w-full py-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl font-bold text-center text-[16px] leading-[1.5] border border-red-200 dark:border-red-900/30">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}s cannot purchase bundles
              </div>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-[#F9FAFB] rounded-2xl font-bold text-[20px] leading-[1.5] flex items-center justify-center gap-3 transition-all shadow-xl shadow-violet-600/20 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
              >
                {purchasing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Get This Bundle</>
                )}
              </button>
            )}

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-[16px] leading-[1.5] text-gray-600 dark:text-gray-300 font-bold">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Full lifetime access to all {bundle.courses?.length} courses</span>
              </div>
              <div className="flex items-center gap-3 text-[16px] leading-[1.5] text-gray-600 dark:text-gray-300 font-bold">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Instant enrollment upon purchase</span>
              </div>
              <div className="flex items-center gap-3 text-[16px] leading-[1.5] text-gray-600 dark:text-gray-300 font-bold">
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Certificate of completion</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
              <p className="text-[16px] leading-[1.5] text-gray-400 font-bold">
                {bundle.courses?.length || 0} courses • {bundle.instructor?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[24px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">Select Payment Method</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${method.color} hover:scale-[1.02] active:scale-95`}
                >
                  <span className="text-3xl">{method.icon}</span>
                  <span className="font-bold text-[16px] leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleDetailsPage;
