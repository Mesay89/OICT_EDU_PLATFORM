import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, PlaySquare, MessageSquare, HelpCircle, Users, BookOpen, ChevronRight, Layout, Star, Calendar, FileText, Clock } from 'lucide-react';
import BASE_URL from '../api/config';
import { useTimezone } from '../context/TimezoneContext';
import Forum from '../components/Social/Forum';
import QA from '../components/Social/QA';
import Cohort from '../components/Social/Cohort';
import CourseReviews from '../components/Reviews/CourseReviews';

const CourseDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const { formatDate } = useTimezone();

  useEffect(() => {
    const fetchCourseAndStatus = async () => {
      try {
        const courseConfig = user?.token
          ? { headers: { Authorization: `Bearer ${user.token}` } }
          : undefined;
        const { data } = await axios.get(`${BASE_URL}/courses/${id}`, courseConfig);
        setCourse(data);

        // Check enrollment status if logged in
        if (user && user.role !== 'admin') {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          
          // Check Enrollment
          const enrollmentsRes = await axios.get(`${BASE_URL}/enrollments/myenrollments`, config);
          const enrolled = enrollmentsRes.data.some(e => {
             const cId = e.course?._id || e.course;
             return cId?.toString() === id;
          });
          setIsEnrolled(enrolled || (user.role === 'instructor' && data.instructor?._id === user._id));

          // Check for pending payments
          const paymentsRes = await axios.get(`${BASE_URL}/payments/my-payments`, config);
          const pending = paymentsRes.data.some(p => {
             const cId = p.course?._id || p.course;
             return cId?.toString() === id && p.status === 'pending';
          });
          setHasPendingPayment(pending);
        } else if (user?.role === 'admin') {
          setIsEnrolled(false);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndStatus();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'admin') {
      alert('Admin accounts cannot enroll in courses. Please use the admin dashboard to review content.');
      navigate('/admin-dashboard');
      return;
    }
    
    const searchParams = new URLSearchParams(window.location.search);
    const intent = searchParams.get('intent');
    
    if (course.price > 0) {
      navigate(`/checkout/${id}${intent ? `?intent=${intent}` : ''}`);
      return;
    }

    setEnrolling(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${BASE_URL}/enrollments`, { courseId: id }, config);
      setIsEnrolled(true);
      alert('Successfully enrolled! You can now start learning.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-950">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
    </div>
  );
  
  if (!course) return (
    <div className="flex justify-center items-center min-h-screen text-center p-8 bg-white dark:bg-zinc-950">
      <div>
        <h1 className="text-4xl font-black mb-4 text-gray-900 dark:text-white">{t('course.not_found')}</h1>
        <Link to="/courses" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">{t('course.browse_all')}</Link>
      </div>
    </div>
  );

  const courseCopy = (key, fallback) => {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  };

  const isInstructorOfCourse = user?._id?.toString() === (course.instructor?._id?.toString() || course.instructor?.toString());
  const isAdminViewer = user?.role === 'admin';

  const tabs = [
    { id: 'overview', label: courseCopy('course.overview', 'Overview'), icon: BookOpen },
    { id: 'curriculum', label: courseCopy('course.curriculum', 'Curriculum'), icon: PlaySquare },
    { id: 'reviews', label: courseCopy('course.reviews', 'Reviews'), icon: Star },
    ...(isEnrolled ? [
      { id: 'forum', label: courseCopy('course.discussions', 'Discussions'), icon: MessageSquare },
      { id: 'qa', label: courseCopy('course.qa', 'Q&A'), icon: HelpCircle },
      { id: 'cohort', label: courseCopy('course.cohort', 'Cohort'), icon: Users },
      { id: 'peer-reviews', label: 'Peer Reviews', icon: FileText },
    ] : [])
  ];

  const translatedCategory = course.category ? t(`categories.${course.category}`) : '';
  const categoryLabel = course.category
    ? translatedCategory !== `categories.${course.category}`
      ? translatedCategory
      : course.category
    : 'Course';
  const moduleCount = course.modules?.length || 0;
  const enrollmentCount = course.enrollmentCount || 0;

  const overviewMetrics = [
    {
      icon: Users,
      value: enrollmentCount === 0 ? null : enrollmentCount,
      label: courseCopy('course.enrolled_count', 'Enrolled Students'),
      helperText: '5000+ students already enrolled on this course',
      cardClass: 'border-indigo-100 bg-white dark:border-indigo-900/40 dark:bg-zinc-950/80',
      iconClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
      valueClass: 'text-indigo-600 dark:text-indigo-300',
    },
    {
      icon: Layout,
      value: moduleCount,
      label: courseCopy('course.modules_count', 'Modules'),
      helperText: `${moduleCount} modules are released for this course`,
      cardClass: 'border-violet-100 bg-white dark:border-violet-900/40 dark:bg-zinc-950/80',
      iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
      valueClass: 'text-violet-600 dark:text-violet-300',
    },
  ];

  const learningHighlights = [
    `Master the core concepts of ${categoryLabel} from scratch`,
    'Build real-world projects to add to your portfolio',
    'Learn best practices and modern techniques',
    'Get lifetime access to all future course updates',
    'Earn a certificate upon completion',
    'Join a global community of learners',
  ];

  const accessHighlights = [
    {
      title: courseCopy('course.full_lifetime_access', 'Full Lifetime Access'),
      subtitle: 'Pay once, learn forever',
      cardClass: 'border-emerald-100 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30',
      iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    {
      title: courseCopy('course.certificate_of_completion', 'Certificate of Completion'),
      subtitle: 'Industry recognized',
      cardClass: 'border-sky-100 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/30',
      iconClass: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300',
    },
    {
      title: courseCopy('course.money_back', '30-Day Money Back Guarantee'),
      subtitle: 'Risk-free enrollment',
      cardClass: 'border-amber-100 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30',
      iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    },
  ];

  const includedItems = [
    {
      icon: PlaySquare,
      label: `${moduleCount} ${courseCopy('course.video_modules', 'Video Modules')}`,
      helper: 'Structured lessons you can return to anytime',
      cardClass: 'border-indigo-100 bg-indigo-50/80 dark:border-indigo-900/40 dark:bg-indigo-950/30',
      iconClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
    },
    {
      icon: CheckCircle,
      label: courseCopy('course.full_lifetime_access', 'Full Lifetime Access'),
      helper: 'Come back whenever you need a refresher',
      cardClass: 'border-emerald-100 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30',
      iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    {
      icon: Users,
      label: courseCopy('course.community_access', 'Community Access'),
      helper: 'Learn alongside other students in the course',
      cardClass: 'border-violet-100 bg-violet-50/80 dark:border-violet-900/40 dark:bg-violet-950/30',
      iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
    },
    {
      icon: Star,
      label: courseCopy('course.certificate_of_completion', 'Certificate of Completion'),
      helper: 'A completion record to showcase your progress',
      cardClass: 'border-amber-100 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30',
      iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative bg-zinc-900 overflow-hidden min-h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img src={course.image} className="w-full h-full object-cover opacity-20 blur-xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 w-full grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
               {t(`categories.${course.category}`)}
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
              {course.title}
            </h1>
            <p className="text-xl text-zinc-300 max-w-3xl leading-relaxed font-medium">
              {course.description}
            </p>
            
            <div className="flex items-center gap-6 pt-4">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/20">
                    {course.instructor?.name?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{courseCopy('course.instructor', 'Instructor')}</p>
                    <p className="text-white font-black">{course.instructor?.name}</p>
                  </div>
               </div>
               <div className="h-10 w-px bg-zinc-800"></div>
               <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{courseCopy('course.enrollment', 'Enrollment')}</p>
                  <p className="text-white font-black">{course.price === 0 ? courseCopy('course.free_access', 'Free access') : `${course.currency} ${course.price}`}</p>
               </div>
               <div className="h-10 w-px bg-zinc-800"></div>
               <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{courseCopy('course.added_on', 'Added on')}</p>
                  <p className="text-white font-black flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    {formatDate(course.createdAt)}
                  </p>
               </div>
            </div>
          </div>

          <div className="hidden lg:block">
             <div className="bg-zinc-800/50 backdrop-blur-3xl rounded-[40px] p-2 border border-white/5 shadow-2xl">
                <div className="aspect-video rounded-[32px] overflow-hidden relative">
                   <img src={course.image} className="w-full h-full object-cover" alt="" />
                   <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                      <span className="text-white font-black text-xl">
                        {course.price === 0 ? courseCopy('course.free_access', 'Free access') : `${course.currency} ${course.price}`}
                      </span>
                   </div>
                </div>
                <div className="p-8 space-y-6 text-center">
                    {isInstructorOfCourse ? (
                       <button onClick={() => navigate('/instructor/courses')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20">
                          <Layout className="w-6 h-6" /> {courseCopy('course.manage_course', 'Manage Course')}
                       </button>
                    ) : isAdminViewer ? (
                       <button onClick={() => navigate('/admin-dashboard')} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20">
                          <Layout className="w-6 h-6" /> Review In Admin Dashboard
                       </button>
                    ) : isEnrolled ? (
                       <>
                         <button onClick={() => navigate(`/player/${id}`)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20">
                            <PlaySquare className="w-6 h-6" /> {courseCopy('course.resume_learning', 'Resume Learning')}
                         </button>
                         <button onClick={() => navigate(`/messages/${course.instructor?._id}`)} className="w-full mt-4 py-4 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl">
                            <MessageSquare className="h-6 w-6" /> {courseCopy('course.message_instructor', 'Message Instructor')}
                         </button>
                       </>
                    ) : hasPendingPayment ? (
                        <div className="w-full py-4 bg-amber-100 text-amber-700 rounded-2xl font-black text-lg flex flex-col items-center justify-center gap-1 border border-amber-200">
                           <Clock className="w-6 h-6 animate-pulse" />
                           <span>Payment Awaiting Approval</span>
                           <p className="text-[10px] opacity-70 uppercase">Please wait for admin verification</p>
                        </div>
                    ) : (
                        <button onClick={handleEnroll} disabled={enrolling} className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-black text-xl transition-all duration-300 shadow-xl hover:bg-indigo-50 hover:text-indigo-600 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95 disabled:bg-zinc-700 disabled:hover:scale-100 disabled:hover:shadow-none">
                           {enrolling ? courseCopy('course.processing', 'Processing...') : course.price === 0 ? courseCopy('course.enroll_free', 'Free access') : courseCopy('course.purchase_now', 'Purchase Now')}
                        </button>
                    )}
                    <p className="text-zinc-500 text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> {courseCopy('course.lifetime_access', 'Lifetime Access')}
                    </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap gap-4 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
                  <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
                    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.28),_transparent_32%),linear-gradient(135deg,#020617_0%,#312e81_52%,#2563eb_100%)] p-8 lg:p-10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),_transparent_32%)]" />
                      <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                      <div className="relative z-10 space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-white/90 backdrop-blur-sm">
                            {courseCopy('course.about_title', 'About This Course')}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm">
                            <BookOpen className="h-4 w-4" />
                            {categoryLabel}
                          </span>
                        </div>
                        <p className="max-w-3xl text-lg font-medium leading-relaxed text-white/90 lg:text-xl">
                          {course.description}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-200/80 bg-slate-50/90 p-6 dark:border-white/10 dark:bg-zinc-950/70 lg:border-l lg:border-t-0 lg:p-8">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        {overviewMetrics.map((metric, idx) => {
                          const Icon = metric.icon;

                          return (
                            <div key={idx} className={`rounded-[28px] border p-5 shadow-sm ${metric.cardClass}`}>
                              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${metric.iconClass}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              {metric.value !== null && metric.value !== undefined && (
                                <p className={`mt-4 text-3xl font-black ${metric.valueClass}`}>{metric.value}</p>
                              )}
                              <p className={`${(metric.value !== null && metric.value !== undefined) ? 'mt-2' : 'mt-4'} text-xs font-black uppercase tracking-[0.24em] text-gray-400 dark:text-zinc-500`}>
                                {metric.label}
                              </p>
                              {metric.helperText && (
                                <p className="mt-3 text-sm font-semibold text-gray-500 dark:text-zinc-400">
                                  {metric.helperText}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.95fr)]">
                  <div className="rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                          {courseCopy('course.start_journey', 'Start Your Journey')}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500 dark:text-zinc-400">
                          A focused roadmap of the outcomes you can expect as you move through the course.
                        </p>
                      </div>
                      <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 sm:flex">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {learningHighlights.map((item, idx) => (
                        <div key={idx} className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-5 transition-colors hover:bg-white dark:border-white/10 dark:bg-zinc-950/50 dark:hover:bg-zinc-950">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-sm font-black text-indigo-600 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-indigo-300">
                              {String(idx + 1).padStart(2, '0')}
                            </div>
                            <p className="pt-1 text-sm font-bold leading-6 text-gray-700 dark:text-zinc-200">
                              {item}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                    <div className="mb-6">
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {courseCopy('course.secure_access', 'Secure Access')}
                      </span>
                      <p className="mt-4 text-sm font-medium leading-6 text-gray-500 dark:text-zinc-400">
                        Everything tied to your enrollment stays accessible after purchase, including recognition and support.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {accessHighlights.map((item, idx) => (
                        <div key={idx} className={`rounded-[28px] border p-4 ${item.cardClass}`}>
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}>
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 dark:text-white">{item.title}</p>
                              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">{item.subtitle}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="space-y-4">
                {course.modules?.map((module, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {idx + 1}
                       </div>
                       <div>
                          <h4 className="font-black text-gray-900 dark:text-white">{module.title}</h4>
                          <p className="text-sm text-gray-500 font-medium">{module.description}</p>
                       </div>
                    </div>
                    {isEnrolled && (
                       <PlaySquare className="h-6 w-6 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <CourseReviews courseId={id} />
            )}

            {activeTab === 'forum' && <Forum courseId={id} />}
            {activeTab === 'qa' && <QA courseId={id} />}
            {activeTab === 'cohort' && <Cohort courseId={id} />}
            {activeTab === 'peer-reviews' && (
               <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Peer Review Arena</h2>
                    <button 
                      onClick={() => navigate(`/peer-review/${id}`)}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all"
                    >
                      Enter Arena
                    </button>
                  </div>
                  <p className="text-gray-500 font-medium">Submit your work and grade your classmates to earn extra points.</p>
               </div>
            )}
          </div>

          <div className="space-y-6">

            {/* What's Included */}
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 shadow-sm border border-gray-100 dark:border-white/5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                    {courseCopy('course.whats_included', "What's Included")}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-500 dark:text-zinc-400">
                    The materials and access that come with your enrollment.
                  </p>
                </div>
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <ul className="space-y-3">
                {includedItems.map((item, idx) => (
                  <li key={idx} className={`rounded-[24px] border p-4 ${item.cardClass}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{item.label}</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-gray-500 dark:text-zinc-400">{item.helper}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Group Learning Card */}
            <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-2xl shadow-purple-500/30 overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_50%)]" />
              <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700">
                <Users className="h-48 w-48 text-white drop-shadow-2xl" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-lg">
                    <Users className="h-4 w-4" />
                    {courseCopy('course.group_learning', 'Group Learning')}
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight mb-3 drop-shadow-md">
                    Learn Together Grow Together
                  </h3>
                  <p className="text-white/90 text-sm font-medium leading-relaxed mb-8 drop-shadow">
                    Join thousands of active students collaborating sharing insights and mastering skills as a community
                  </p>
                </div>
                <button className="w-full py-3.5 bg-white/90 backdrop-blur text-purple-700 rounded-2xl font-black text-sm hover:bg-white hover:text-purple-800 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/20 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2">
                  {courseCopy('course.learn_more', 'Learn More')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
